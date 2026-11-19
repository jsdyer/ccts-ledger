"""Extract numeric measures for the leading brands in published CCTS annual reports."""
import json,re
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from lxml import html

ROOT=Path(__file__).resolve().parents[1]
def fetch(url):
    with urlopen(Request(url,headers={'User-Agent':'CoolCode public annual report reader'}),timeout=50) as response:return html.fromstring(response.read())
def clean(node):return ' '.join(node.text_content().split())
def extract(year):
    base=f'https://pub.ccts-cprst.ca/{year-1}-{year}-annual-report/working-with-service-providers/'
    landing=f'https://www.ccts-cprst.ca/report/annual-report-{year-1}-{year}/'
    doc=fetch(base)
    for table in doc.xpath('//table'):
        trs=table.xpath('.//tr')
        header=[clean(c).lower() for c in trs[0].xpath('th|td')] if trs else []
        if 'accepted complaints' not in header or 'service provider' not in header:continue
        rows=[]
        for tr in trs[1:]:
            cells=[clean(c) for c in tr.xpath('td')]
            if len(cells)<8:continue
            num=lambda s:float(s.strip().replace(',','').replace('%','').replace('−','-'))
            rows.append({'brand':cells[1],'accepted':int(num(cells[2])),'share':num(cells[3]),'closed':int(num(cells[5])),'resolution':num(cells[6]),'escalation':num(cells[7])})
            if len(rows)==10:break
        if len(rows)!=10 or len(set(r['brand'] for r in rows))!=10:raise ValueError('Unexpected leading provider table')
        break
    else:raise ValueError('Unrecognized provider-report layout')
    links=fetch(landing).xpath('//a/@href')
    sources={key:next(u for u in links if token in u and u.endswith('.xlsx')) for key,token in [('operational','Operational-Statistics'),('issues','Leading-Complaint-Issues')]}
    return {'year':year,'start':f'{year-1}-08-01','end':f'{year}-07-31','url':base,'landing':landing,'workbooks':sources,'brands':rows}
def main():
    current=datetime.now(timezone.utc)
    editions=[]
    for year in range(2023,current.year+1):
        try:editions.append(extract(year))
        except HTTPError as e:
            if year==current.year and e.code==404:break
            raise
    data={'retrieved':current.date().isoformat(),'count':sum(len(e['brands']) for e in editions),'first':editions[0]['start'],'latest':editions[-1]['end'],'editions':editions}
    out=ROOT/'web/data/index.json'
    if out.exists() and data['latest']<json.loads(out.read_text())['latest']:raise ValueError('Source coverage regressed')
    out.with_suffix('.tmp').write_text(json.dumps(data,ensure_ascii=False,indent=1)+'\n')
    out.with_suffix('.tmp').replace(out)
    print('Loaded',data['count'],'provider-year rows',data['latest'])
if __name__=='__main__':main()
