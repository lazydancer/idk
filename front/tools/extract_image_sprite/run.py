from bs4 import BeautifulSoup
from requests import get
import tinycss
import re
import json

base_url = "https://minecraft-ids.grahamedgecombe.com/"
base_url_html = get(base_url).text
css_parser = tinycss.make_parser('page3')

soup = BeautifulSoup(base_url_html, "html.parser")
items = soup.find_all("tr", {"class": "row"})
stylesheets = [base_url + style["href"] for style in soup.select('link[rel="stylesheet"]')]

sprite_sheet_url = None
positions = {}
li = {}


for sheet in stylesheets:
    data = get(sheet).text
    style = css_parser.parse_stylesheet(data)

    for rule in style.rules:
        selector = rule.selector.as_css()  # selector name (i.e. .items-*-*-*)

        if re.search(r'.items-', selector[:7]):
            [url, x, y, _] = rule.declarations[2].value.as_css().split(" ")

            positions[selector[7:]] = (
                abs(int(x.replace("px", ""))),
                abs(int(y.replace("px", "")))
            )

            if (sprite_sheet_url == None):
                sprite_sheet_url = base_url + url[4:-1]



result = {}
for a in items:
    pos_id = a.find("td", {"class": "row-icon"}).div["class"][1][6:]
    name_id = a.find("td", {"class": "row-desc"}).span.text.replace(" ","_").lower()
    pos = positions[pos_id]

    result[name_id] = pos

with open('spirte_map.json', 'w') as f:
    json.dump(result, f)