#!/usr/bin/env python3
"""Write a tiny redirect page at every oldPaths entry in gooae/toys.json.

Run from the repo root:  python3 gooae/_tools/make_stubs.py
A stub is only written where nothing exists yet, or where an earlier stub sits,
so a real page is never overwritten.
"""
import json, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://osstessela.com'
MARK = '<!-- gooae-redirect-stub -->'

TEMPLATE = """<!DOCTYPE html>
{mark}
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title} moved · GOOAE</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="{site}{target}">
<meta http-equiv="refresh" content="0; url={target}">
<script>location.replace('{target}' + location.search + location.hash);</script>
</head>
<body style="background:#100817;color:#F4E9FF;font:16px system-ui,sans-serif;padding:2rem">
<p>{title} has a new home: <a style="color:#FF4BBF" href="{target}">osstessela.com{target}</a></p>
</body>
</html>
"""

def main():
    reg = json.load(open(os.path.join(ROOT, 'gooae', 'toys.json'), encoding='utf-8'))
    written = 0
    for t in reg['toys']:
        target = '/gooae/' + t['path']
        for old in t.get('oldPaths', []):
            rel = old + 'index.html' if old.endswith('/') else old
            dest = os.path.join(ROOT, rel)
            if os.path.exists(dest):
                with open(dest, encoding='utf-8', errors='ignore') as fh:
                    if MARK not in fh.read(400):
                        print('SKIP real file exists:', rel, file=sys.stderr)
                        continue
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, 'w', encoding='utf-8') as fh:
                fh.write(TEMPLATE.format(mark=MARK, title=t['title'], target=target, site=SITE))
            written += 1
            print('stub', rel, '->', target)
    print(written, 'stubs')

if __name__ == '__main__':
    main()
