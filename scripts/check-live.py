import urllib.request,urllib.error,http.cookiejar,time,json,concurrent.futures,sys
jar=http.cookiejar.CookieJar();s=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));origin=sys.argv[1];s.open(origin+'/?_vercel_share='+sys.argv[2],timeout=20).read()
bounds=[-2.129,52.584,-2.125,52.588]
tasks=[('cad',{'bounds':bounds}),('ohl',{'bounds':bounds}),('services',{'bounds':bounds}),('constraints',{'bounds':bounds}),('search',{'query':'WV1 1LD'}),('route',{'from':[-2.14,52.58],'to':[-2.128,52.584],'vehicle':{'height':4,'width':2.55,'length':10,'weight':24,'name':'24 t rigid'}})]
def run(task):
 name,payload=task;t=time.time()
 try:
  req=urllib.request.Request(origin+'/api/'+name,data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'},method='POST')
  try:r=s.open(req,timeout=30)
  except urllib.error.HTTPError as e:r=e
  d=json.loads(r.read());return {'name':name,'http':r.status,'ms':round((time.time()-t)*1000),'state':d.get('state'),'count':len(d.get('features',d.get('results',[]))),'km':d.get('distanceKm'),'error':d.get('error'),'message':d.get('message')}
 except Exception as e:return {'name':name,'error':type(e).__name__,'ms':round((time.time()-t)*1000)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: results=list(pool.map(run,tasks))
print(json.dumps(results,indent=2));open('evidence/providers-deployed.json','w').write(json.dumps(results,indent=2))
