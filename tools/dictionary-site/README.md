# Brainy Elephant Dictionary test

The public trial is at https://brainyelephant.com/dictionary/ . It includes 36 real word pages with server-rendered definitions, source attributions, unique meaning/definition titles, canonical links, a sitemap and a browser search over the published selection. This is a small public trial, not the full dictionary deployed online. Search rankings and indexing are not guaranteed. No tracking or contribution form is included.

The main Brainy Elephant business page is preserved, with one added Dictionary navigation link. Before this change the entire original repository was preserved at branch backup-before-dictionary-2026-10-16, commit 59a73ac2c9836589dec80bb536ea870dccac96d4. Reverting the dictionary-test commit restores the original state; keep later changes in mind when reverting.

## Full local version for Big Dell

The Python server in this folder can search all 787,611 entries from the separate merged v0.3 dictionary package. It uses only Python 3.9+ standard libraries.

1. Extract Brainy_Elephant_Dictionary_Merged_v0_3.zip.
2. Copy its data folder into this tools/dictionary-site folder, next to server.py.
3. Double-click START_DICTIONARY.bat. The first run prepares a local SQLite search index and then opens the browser. Later starts reuse it. Keep the console open; Ctrl+C stops the server.

By default the local site is http://127.0.0.1:8765 and is set to noindex. It is not publicly reachable. The optional --data argument can point to the existing merged data folder instead of copying it. Data and generated SQLite index are excluded from Git. Allow room for the extracted dictionary and local index.

A future public self-hosting setup needs HTTPS/reverse proxy and network/domain configuration; this local test does not change router or DNS settings. The --public-url flag controls canonical URLs/indexing metadata only; it does not make a private computer publicly reachable.

## Validation

Six HTTP/application tests passed against the full dictionary: real meanings/attribution, search redirects and suggestions, missing words and HTML escaping, local robots/noindex, public metadata and sitemap, HEAD and assets. All 40 exported HTML pages passed heading/title/canonical and internal link checks. Browser JavaScript passed node --check. Automated browser visual QA was unavailable. Public search-index eligibility is tested through actual HTML/robots/sitemap responses; Google indexing itself remains unverified.

## Rights

Generated website code: MIT (LICENSE-CODE.txt). Definitions: WordNet contributors (CC BY 4.0) and Wiktionary contributors via Kaikki (CC BY-SA 4.0); the adapted merged collection is CC BY-SA 4.0. Public pages link to /dictionary/sources/ and each relevant source. Full notices are bundled in /dictionary/. No source endorsement or official Scrabble compatibility is claimed.
