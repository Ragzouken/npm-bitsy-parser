import { readFileSync } from 'fs';
import { resolve } from 'path';
import { BitsyParser } from '..';

test.each`
	file         | version
	${'default'} | ${'2.2'}
	${'complex'} | ${'2.2' /*includes legacy walls */}
	${'default'} | ${'4.6'}
	${'default'} | ${'5.1'}
	${'default'} | ${'6.2'}
	${'default'} | ${'7.1'}
	${'complex'} | ${'7.1' /*includes extended palette, extended animation frames, exit transitions, exit dialog */}
	${'default'} | ${'8.0'}
	${'complex'} | ${'8.0' /*includes sprite background colours, avatar by room */}
	`('parses and serializes $file sample for bitsy v$version without modifying it', ({ file, version }) => {
	const gamedata = readFileSync(resolve(__dirname, `./${file}_${version}.txt`), { encoding: 'utf-8' }).replace(/\r/g, '');
	expect(BitsyParser.parse(gamedata.split('\n')).toString()).toBe(gamedata);
});

test.each`
	version | major | minor
	${'2.2'} | ${2} | ${2}
	${'4.6'} | ${4} | ${6}
	${'5.1'} | ${5} | ${1}
	${'6.2'} | ${6} | ${2}
	${'7.1'} | ${7} | ${1}
	${'8.0'} | ${8} | ${0}
	`('full, major, and minor version is defined for bitsy v$version', ({ version, major, minor }) => {
	const gamedata = readFileSync(resolve(__dirname, `./default_${version}.txt`), { encoding: 'utf-8' }).replace(/\r/g, '');
	const world = BitsyParser.parse(gamedata.split('\n'));
	expect(world.bitsyVersion).toBe(version);
	expect(world.bitsyVersionMajor).toBe(major);
	expect(world.bitsyVersionMinor).toBe(minor);
});
