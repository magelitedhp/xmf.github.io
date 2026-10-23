"""Package complete original resources without rasterizing native animations."""
import argparse, hashlib, json, zipfile
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--output',type=Path,default=Path('.tmp-pvz-portable/local-resources'))
args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
files=[p for name in ['images','reanim','compiled','particles','sounds','data','fonts','properties'] for p in (args.source/name).rglob('*') if p.is_file()]
files += list(args.source.glob('lawnbgm*.mp3'))
groups=[];group=[];size=0
for p in sorted(files):
    n=p.stat().st_size
    if size+n>24*1024*1024 and group:groups.append(group);group=[];size=0
    group.append(p);size+=n
if group:groups.append(group)
manifest={'format':1,'source':'PVZ CUTE V0.9.5','files':len(files),'bytes':sum(p.stat().st_size for p in files),'parts':[],'textConversions':[]}
for i,group in enumerate(groups):
    out=args.output/f'resources-{i:02d}.zip'
    with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in group:
            data=p.read_bytes();name=p.relative_to(args.source).as_posix()
            if p.suffix.lower() in ['.txt','.xml']:
                try:data.decode('utf-8-sig')
                except UnicodeDecodeError:
                    try:data=data.decode('gb18030').encode('utf-8-sig');manifest['textConversions'].append(name)
                    except UnicodeDecodeError:pass
            z.writestr(name,data)
    manifest['parts'].append({'file':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
    print(out.name,out.stat().st_size,flush=True)
(args.output/'resources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Packaged',manifest['files'],'files; bytes',manifest['bytes'],'converted texts',manifest['textConversions'])
