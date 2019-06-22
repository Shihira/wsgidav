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
    
    def is_valid(self):
        return isinstance(self._res, FileResource)

    def _get_comic_toc(self):
        file_path = self._res.get_file_path()

        if file_path in COMIC_CACHE:
            lm, old_toc = COMIC_CACHE[file_path]
            if lm == self._res.get_last_modified():
                return old_toc

        files = []
        with zipfile.ZipFile(file_path) as z:
            files = z.namelist()

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
        toc = self._get_comic_toc()
        info = {}
        for k, v in toc.items():
            info[k] = len(v)

        return "200 OK", [("Content-Type", "application/json")], dumps(info)

    def img(self):
        toc = self._get_comic_toc()

        page = self._query.get("page", ["0"])[0]
        page = int(page) if page.isdigit() else 0

        first_chapter = next(iter(toc))
        chapter = self._query.get("chapter", [first_chapter])[0]

        if chapter not in toc:
            ret = {"message": "chapter %s not found " % chapter}
            return "404 Not Found", [], dumps(ret)
        pages = toc[chapter]
        if page >= len(pages):
            ret = {"message": "chapter %s has %d pages while %d is requested" % (chapter, len(pages), page)}
            return "404 Not Found", [], dumps(ret)

        with zipfile.ZipFile(self._res.get_file_path()) as z:
            f = pages[page]
            mime = mimetypes.guess_type(f)[0]
            content = z.read(f)

            return "200 OK", [("Content-Type", mime)], content


