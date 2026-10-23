"""Match upstream engine resource IDs to existing original-game files."""
import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path


IMAGE_ALIASES = {
    'zombatarfacialhairbutton': 'zombatarfhairbutton',
    'zombatarfacialhairbuttonhighlight': 'zombatarfhairbuttonhighlight',
    'zombatarfacialhairbuttonover': 'zombatarfhairbuttonover',
    'zombiebackupinnerarmhand': 'zombiebackupinnerhand',
    'zombiebackupouterarmupper2': 'zombiebackupouterarmupperbone',
    'zombiediscoouterarmhand': 'zombiediscoouterhand',
    'zombiediscoouterarmupper2': 'zombiediscoouterarmupperbone',
    'selectorscreenachievementspedestal': 'achievementspedestal',
    'selectorscreenachievementspedestalpress': 'achievementspedestalpress',
    'selectorscreenmorewaystoplaybg': 'selectormorewaystoplaybackground',
}


def normalize(name):
    return re.sub('[^a-z0-9]', '', name.lower())


def prepare(source, engine_root):
    tree = ET.parse(source / 'properties/resources.xml')
    seen = set()
    for group in tree.getroot():
        prefix = ''
        for element in group:
            if element.tag == 'SetDefaults':
                prefix = element.get('idprefix', prefix)
            elif element.get('id'):
                seen.add(prefix + element.get('id'))

    images = {
        normalize(p.stem): p
        for directory in ['images', 'reanim', 'data', 'properties']
        for p in sorted((source / directory).glob('*'))
        if p.suffix.lower() in ['.png', '.jpg', '.gif'] and not p.stem.endswith('_')
    }
    sounds = {
        normalize(p.stem): p for p in sorted((source / 'sounds').glob('*'))
        if p.suffix.lower() in ['.ogg', '.wav', '.au']
    }
    code = (engine_root / 'src/Resources.cpp').read_text(encoding='utf-8')
    extractors = list(re.finditer(
        r'bool Sexy::Extract(\w+)Resources\([^)]*\)\s*\{(.*?)\n\}', code, re.S,
    ))
    if not extractors:
        raise ValueError('No resource extraction functions found in engine source')
    groups, sound_groups, missing = {}, {}, []
    for match in extractors:
        group = match.group(1)
        for ident in re.findall(r'GetImageThrow\("([^"]+)"\)', match.group(2)):
            if ident in seen:
                continue
            stem = normalize(ident.removeprefix('IMAGE_REANIM_').removeprefix('IMAGE_'))
            path = images.get(IMAGE_ALIASES.get(stem, stem))
            if path is None:
                missing.append(ident)
                continue
            groups.setdefault(group, []).append({
                'id': ident, 'path': path.relative_to(source).with_suffix('').as_posix(),
            })
            seen.add(ident)
        for ident in re.findall(r'GetSoundThrow\("([^"]+)"\)', match.group(2)):
            if ident in seen:
                continue
            path = sounds.get(normalize(ident.removeprefix('SOUND_')))
            if path is None:
                missing.append(ident)
                continue
            sound_groups.setdefault(group, []).append({
                'id': ident, 'path': path.relative_to(source).with_suffix('').as_posix(),
            })
            seen.add(ident)

    compiled = {
        p.relative_to(source).as_posix().lower(): p.relative_to(source).as_posix()
        for p in (source / 'compiled').rglob('*') if p.is_file()
    }
    aliases = {}
    for path in sorted((engine_root / 'src').rglob('*.cpp')):
        for name in re.findall(
            r'"((?:reanim|particles)/[^"\n]+\.(?:reanim|xml|trail))"',
            path.read_text(encoding='utf-8', errors='replace'),
        ):
            expected = 'compiled/' + name + '.compiled'
            actual = compiled.get(expected.lower())
            if actual and actual != expected:
                aliases[expected] = actual
    return {
        'groups': groups, 'soundGroups': sound_groups,
        'compiledAliases': aliases, 'missing': missing,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--engine-root', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path(
        'public/games/pvz-kindergarten/native/compat.json',
    ))
    args = parser.parse_args()
    result = prepare(args.source, args.engine_root)
    if result['missing']:
        raise SystemExit('Unmatched resources: ' + ', '.join(result['missing']))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('Image aliases:', sum(map(len, result['groups'].values())))
    print('Sound aliases:', sum(map(len, result['soundGroups'].values())))
    print('Compiled path aliases:', len(result['compiledAliases']))


if __name__ == '__main__':
    main()
