"""Integration check. Uses only a generated disposable project; never real user data.
Usage: python3 scripts/check-cloud.py HTTPS_ORIGIN TEMPORARY_REVIEW_TOKEN [project.json]
"""
import urllib.request,urllib.error,http.cookiejar,json,sys
jar=http.cookiejar.CookieJar();s=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));origin=sys.argv[1];s.open(origin+'/?_vercel_share='+sys.argv[2],timeout=20).read()
def call(data,key=None):
 headers={'Content-Type':'application/json'}
 if key:headers['Authorization']='Bearer '+key
 try:r=s.open(urllib.request.Request(origin+'/api/cloud',data=json.dumps(data).encode(),headers=headers),timeout=30)
 except urllib.error.HTTPError as e:r=e
 return r.status,json.loads(r.read())
p=json.load(open(sys.argv[3])) if len(sys.argv)>3 else {'format':'SAMI-ELITE-1','version':1,'id':'validation-only','name':'Disposable cloud test','origin':[-2.127,52.586],'features':[],'meta':{},'revision':0,'view':{'center':[-2.127,52.586],'zoom':18,'basemap':'cad'}}
checks=[];key=None
try:
 status,d=call({'operation':'create','project':p});key=d.get('key');checks.append({'action':'create','http':status,'version':d.get('version')});assert status==200 and key
 status,r=call({'operation':'read'},key);checks.append({'action':'read','http':status,'version':r.get('version'),'sameVersionToken':d['etag']==r.get('etag')});assert status==200 and d['etag']==r.get('etag')
 status,v=call({'operation':'save','project':p,'etag':d['etag']},key);checks.append({'action':'save','http':status,'version':v.get('version')});assert status==200 and v['version']==2
 status,c=call({'operation':'save','project':p,'etag':d['etag']},key);checks.append({'action':'reject-stale-save','http':status});assert status==409
 status,r=call({'operation':'read'},key);assert status==200
 status,v=call({'operation':'save','project':p,'etag':'W/'+r['etag']},key);checks.append({'action':'accept-equivalent-compressed-token','http':status,'version':v.get('version')});assert status==200 and v['version']==3
finally:
 if key:
  status,r=call({'operation':'read'},key)
  if status==200:
   status,v=call({'operation':'delete','etag':r['etag']},key);checks.append({'action':'cleanup-disposable-project','http':status})
 print(json.dumps(checks,indent=2))
 open('evidence/cloud-live.json','w').write(json.dumps(checks,indent=2))
