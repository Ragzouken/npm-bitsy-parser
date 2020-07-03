import { readFileSync } from 'fs';
import { resolve } from 'path';
import { BitsyParser } from '..';

test.each`
	file         | version
	${'default'} | ${'4.6'}
	${'default'} | ${'5.1'}
	${'default'} | ${'6.2'}
	${'default'} | ${'7.1'}
`('parses and serializes $file sample for bitsy v$version without modifying it', ({ file, version }) => {
	const gamedata = readFileSync(resolve(__dirname, `./${file}_${version}.txt`), { encoding: 'utf-8' });
	expect(BitsyParser.parse(gamedata.split('\n')).toString()).toBe(gamedata);
});
