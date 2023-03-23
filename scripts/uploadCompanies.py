import pandas as pd
import requests
from tqdm import tqdm

df = pd.read_csv("companies_sorted.csv").fillna("-1")
df.replace(r'^\s*$', "-1", regex=True)
df = df[df.country == "united states"]
df = df.values

for i in tqdm(range(500)):
    comp = df[i]
    # print(comp)
    res = requests.post("<url>", data={
        "name": comp[1],
        "domain": comp[2],
        "founded": int(comp[3]),
        "industry": comp[4],
        "size": comp[5],
        "country": comp[7],
        "link": comp[8],
    }, headers={
        "Authorization": "Bearer <token>"
    })
    # print(res.json())
    # break
