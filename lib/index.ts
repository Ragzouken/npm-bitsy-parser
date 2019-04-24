export class BitsyWorld
{
    public palettes: {[index:string]: BitsyPalette} = {};
    public tiles: {[index:string]: BitsyTile} = {};
    public sprites: {[index:string]: BitsySprite} = {};
    public items: {[index:string]: BitsyItem} = {};
    public toString() {
        function valuesToString(obj: {[index:string]: BitsyResource}) {
            return Object.keys(obj).map(s => obj[s].toString()).join('\n\n');
        }
        return `
TODO: title

TODO: version

TODO: room format

${valuesToString(this.palettes)}

TODO: rooms

${valuesToString(this.tiles)}

${valuesToString(this.sprites)}

${valuesToString(this.items)}

TODO: dialogue

TODO: variables`
    }
}

export interface BitsyResource
{
    id: string;
    name: string;
}

export interface BitsyObject extends BitsyResource
{
    graphic: BitsyGraphic;
    palette: number;
}

export class BitsyResourceBase implements BitsyResource
{
    static typeName: string = "";
    public id: string = "";
    public name: string = "";
    get type() {
        const brb = <typeof BitsyResourceBase>this.constructor;
        return brb;
    }
}

export class BitsyObjectBase extends BitsyResourceBase implements BitsyObject
{
    static paletteDefault: number = 1;
    public graphic: BitsyGraphic = [];
    public palette: number;
    public dialogueID: string = "";
    public position?: { room: string, x: number, y: number };
    public wall: boolean = false;
    constructor() {
        super();
        this.palette = this.type.paletteDefault;
    }
    get type() {
        const bob = <typeof BitsyObjectBase>this.constructor;
        return bob;
    }
    public toString() {
        const props = [];
        props.push(`${this.type.typeName} ${this.id}`);
        props.push(this.graphic.map(g => g.map(b => b ? 1 : 0).join(',').replace(/((?:.,){7}.),/g, '$1\n')).join('\n>\n'));
        if (this.name) {
            props.push(`NAME ${this.name}`);
        }
        if (this.dialogueID) {
            props.push(`DLG ${this.dialogueID}`);
        }
        if (this.position) {
            props.push(`POS ${this.position.room} ${this.position.x},${this.position.y}`);
        }
        if (this.wall) {
            props.push(`WAL true`);
        }
        if (this.palette !== this.type.paletteDefault) {
            props.push(`COL ${this.palette}`);
        }
        return props.join('\n');
    };
}

export class BitsyTile extends BitsyObjectBase
{
    static paletteDefault: number = 1;
    static typeName: string = "TIL";
}

export class BitsySprite extends BitsyObjectBase
{
    static paletteDefault: number = 2;
    static typeName: string = "SPR";
}

export class BitsyItem extends BitsyObjectBase
{
    static paletteDefault: number = 2;
    static typeName: string = "ITM";
}

export type BitsyGraphicFrame = boolean[];
export type BitsyGraphic = BitsyGraphicFrame[];

export class BitsyPalette extends BitsyResourceBase
{
    static typeName: string = "PAL";
    public colors: number[] = [];

    public constructor()
    {
        super();

        this.colors = [];
    }

    public get background(): number { return this.colors[0]; }
    public get tile(): number { return this.colors[1]; }
    public get sprite(): number { return this.colors[2]; }
    public toString() {
        return `${this.type.typeName} ${this.id}
${this.colors.map(c => `${(c >> 16) & 255},${(c >> 8) & 255},${c & 255}`).join('\n')}`;
    }
}

export class BitsyParser
{
    static parse(lines: string[]): BitsyWorld
    {
        const parser = new BitsyParser();
        parser.parseLines(lines);

        return parser.world;
    }

    public world: BitsyWorld = new BitsyWorld();
    private lineCounter: number = 0;
    private lines: string[] = [];

    public reset(): void
    {
        this.lineCounter = 0;
        this.lines = [];
        this.world = new BitsyWorld();
    }

    public parseLines(lines: string[]): void
    {
        this.reset();
        this.lines = lines;

        while (!this.done)
        {
                 if (this.checkLine("PAL")) this.takePalette();
            else if (this.checkLine("TIL")) this.takeTile();
            else if (this.checkLine("SPR")) this.takeSprite();
            else if (this.checkLine("ITM")) this.takeItem();
            else
            {
                while (!this.checkBlank())
                {
                    this.skipLine();
                }

                this.skipLine();
            }
        }
    }

    private get done(): boolean 
    { 
        return this.lineCounter >= this.lines.length; 
    }

    private get currentLine(): string
    {
        return this.lines[this.lineCounter];
    }

    private checkLine(check: string): boolean
    {
        return this.currentLine.startsWith(check);
    }

    private checkBlank(): boolean
    {
        return this.done || this.currentLine.trim().length == 0;
    }

    private takeLine(): string
    {
        const line = this.currentLine;
        this.lines[this.lineCounter] = "";
        this.lineCounter += 1;

        return line;
    }

    private skipLine(): void
    {
        this.takeLine();
    }

    private takeSplit(delimiter: string): string[]
    {
        return this.takeLine().split(delimiter);
    }
    
    private takeSplitOnce(delimiter: string) : [string, string]
    {
        const line = this.takeLine();
        const i = line.indexOf(delimiter);
        
        return [line.slice(0, i), line.slice(i + delimiter.length)]; 
    }

    private takeColor(): number
    {
        const [r, g, b] = this.takeSplit(",");
        
        return (parseInt(b, 10) <<  0)
             | (parseInt(g, 10) <<  8)
             | (parseInt(r, 10) << 16);
    }

    private takeResourceID(resource: BitsyResource)
    {
        resource.id = this.takeSplitOnce(" ")[1];
    }

    private tryTakeResourceName(resource: BitsyResource)
    {
        resource.name = this.checkLine("NAME") ? this.takeSplitOnce(" ")[1] : "";
    }

    private tryTakeObjectPalette(object: BitsyObject): void
    {
        if (this.checkLine("COL"))
        {
            object.palette = parseInt(this.takeSplitOnce(" ")[1]);
        }
    }

    private tryTakeObjectDialogueID(object: {"dialogueID": string})
    {
        if (this.checkLine("DLG"))
        {
            object.dialogueID = this.takeSplitOnce(" ")[1];
        }
    }

    private tryTakeSpritePosition(sprite: BitsyObjectBase)
    {
        if (this.checkLine("POS"))
        {
            const [room, pos] = this.takeSplitOnce(" ")[1].split(" ");
            const [x, y] = pos.split(",");
            sprite.position = { room, x: parseInt(x, 10), y: parseInt(y, 10) };
        }
    }

    private tryTakeTileWall(tile: BitsyObjectBase)
    {
        if (this.checkLine("WAL"))
        {
            tile.wall = this.takeSplitOnce(" ")[1] === "true";
        }
    }

    private takePalette(): void
    {
        const palette = new BitsyPalette();
        this.takeResourceID(palette);
        this.tryTakeResourceName(palette);

        while (!this.checkBlank())
        {
            palette.colors.push(this.takeColor());
        }

        this.world.palettes[palette.id] = palette;
    }

    private takeFrame(): BitsyGraphicFrame
    {
        const frame: BitsyGraphicFrame = new Array(64).fill(false);

        for (let i = 0; i < 8; ++i)
        {
            const line = this.takeLine();

            for (let j = 0; j < 8; ++j)
            {
                frame[i * 8 + j] = line.charAt(j) == "1";
            }
        }

        return frame;
    }

    private takeObjectGraphic(object: BitsyObject): void
    {
        const graphic: BitsyGraphic = [];

        let moreFrames;
        do
        {
            graphic.push(this.takeFrame());
            moreFrames = this.checkLine(">");
            if(moreFrames) {
                this.skipLine();
            }
        }
        while (moreFrames);

        object.graphic = graphic;
    }

    private takeTile(): void
    {
        const tile = new BitsyTile();
        this.takeResourceID(tile);
        this.takeObjectGraphic(tile);
        this.tryTakeResourceName(tile);
        this.tryTakeTileWall(tile);
        this.tryTakeObjectPalette(tile);

        this.world.tiles[tile.id] = tile;
    }

    private takeSprite(): void
    {
        const sprite = new BitsySprite();
        this.takeResourceID(sprite);
        this.takeObjectGraphic(sprite);
        this.tryTakeResourceName(sprite);
        this.tryTakeObjectDialogueID(sprite);
        this.tryTakeSpritePosition(sprite);
        this.tryTakeObjectPalette(sprite);

        this.world.sprites[sprite.id] = sprite;
    }

    private takeItem(): void
    {
        const item = new BitsyItem();
        this.takeResourceID(item);
        this.takeObjectGraphic(item);
        this.tryTakeResourceName(item);
        this.tryTakeObjectDialogueID(item);
        this.tryTakeObjectPalette(item);

        this.world.items[item.id] = item;
    }
}
