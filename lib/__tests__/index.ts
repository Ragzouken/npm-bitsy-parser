import { readFileSync } from 'fs';
import { resolve } from 'path';
import { BitsyParser } from '..';

it('parses and serializes correctly formatted data without modifying it', () => {
	const gamedata = readFileSync(resolve(__dirname, './default game 4.6.txt'), { encoding: 'utf-8' });
	expect(BitsyParser.parse(gamedata.split('\n')).toString()).toBe(gamedata);
});
