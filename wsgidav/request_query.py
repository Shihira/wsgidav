from wsgidav.fs_dav_provider import FileResource
from wsgidav.request_server import mime_query

import os
import mimetypes
import zipfile
from json import dumps

COMIC_CACHE = {}

@mime_query(["application/vnd.comicbook+zip"])
class ComicQuery(object):
    def __init__(self, res, q):
        self._res = res
        self._query = q

        cbz_name = os.path.basename(self._res.get_file_path())
        if cbz_name == ".folder.cbz":
            self._get_comic_file_list = self._folder_get_comic_file_list
            self._get_comic_content = self._folder_get_comic_content
        else:
            self._get_comic_file_list = self._zipped_get_comic_file_list
            self._get_comic_content = self._zipped_get_comic_content
    
    def is_valid(self):
        return isinstance(self._res, FileResource)

    def _get_comic_content(self, filename):
        raise NotImplementedError()

    def _get_comic_file_list(self):
        raise NotImplementedError()

    def get_comic_toc(self):
        file_path = self._res.get_file_path()

        if file_path in COMIC_CACHE:
            lm, old_toc = COMIC_CACHE[file_path]
            if lm == self._res.get_last_modified():
                return old_toc

        files = self._get_comic_file_list()

        toc = {}

        for f in files:
            if os.path.splitext(f)[1].lower() not in [".png", ".jpg"]:
                continue
            parts = f.split("/")
            name = "" if len(parts) < 2 else parts[0]
            if name not in toc:
                toc[name] = []
            toc[name] += [f]

        for k in toc:
            toc[k].sort()

        COMIC_CACHE[file_path] = (self._res.get_last_modified(), toc) 
        return toc

    def info(self):
        toc = self.get_comic_toc()
        info = {}
        for k, v in toc.items():
            info[k] = len(v)

        return "200 OK", [("Content-Type", "application/json")], dumps(info)

    def img(self):
        toc = self.get_comic_toc()

        page = self._query.get("page", ["0"])[0]
        page = int(page) if page.isdigit() else 0

        first_chapter = next(iter(toc))
        chapter = self._query.get("chapter", [first_chapter])[0]

        max_size = self._query.get("max_size", ["2048"])[0]
        max_size = int(max_size) if max_size.isdigit() else "2048"

        if chapter not in toc:
            ret = {"message": "chapter %s not found " % chapter}
            return "404 Not Found", [], dumps(ret)
        pages = toc[chapter]
        if page >= len(pages):
            ret = {"message": "chapter %s has %d pages while %d is requested" % (chapter, len(pages), page)}
            return "404 Not Found", [], dumps(ret)

        filename = pages[page]
        content = self._get_comic_content(filename)

        from PIL import Image
        import io

        image = Image.open(io.BytesIO(content))
        image.thumbnail((max_size, max_size), Image.BILINEAR)
        image = image.convert("RGB")
        image_bytes = io.BytesIO()
        image.save(image_bytes, "jpeg")

        return "200 OK", [("Content-Type", "image/jpeg")], image_bytes.getvalue()


    ###########################################################################
    #### Zipped
    def _zipped_get_comic_file_list(self):
        file_path = self._res.get_file_path()

        files = []
        with zipfile.ZipFile(file_path) as z:
            files = z.namelist()
        return files

    def _zipped_get_comic_content(self, filename):
        file_path = self._res.get_file_path()

        with zipfile.ZipFile(self._res.get_file_path()) as z:
            content = z.read(filename)

        return content

    #### Folder
    def _folder_get_comic_file_list(self):
        file_path = os.path.dirname(self._res.get_file_path())

        import glob
        pwd = os.getcwd()
        try:
            os.chdir(file_path)
            files = glob.glob("**/*", recursive=True)
        finally:
            os.chdir(pwd)
        return files

    def _folder_get_comic_content(self, filename):
        file_path = os.path.dirname(self._res.get_file_path())

        import glob
        pwd = os.getcwd()
        content = b""
        try:
            os.chdir(file_path)
            with open(filename, "rb") as f:
                content = f.read()
        finally:
            os.chdir(pwd)
        return content

