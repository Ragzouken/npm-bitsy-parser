# @bitsy/parser
A Node.js module that parses bitsy gamedata.

## Installation 
```sh
npm install @bitsy/parser --save
yarn add @bitsy/parser
bower install @bitsy/parser --save
```
## Usage
### Javascript
```javascript
var parser = require('@bitsy/parser');
var world = parser.BitsyParser.parse(gamedata); // gamedata is an string array of lines
```
### TypeScript
```typescript
import { BitsyParser } from '@bitsy/parser';
const world = BitsyParser.parse(gamedata); // gamedata is an string array of lines
```
