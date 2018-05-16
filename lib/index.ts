export class BitsyWorld
{
    public palettes: {[index:string]: BitsyPalette} = {};
    public tiles: {[index:string]: BitsyTile} = {};
    public sprites: {[index:string]: BitsySprite} = {};
    public items: {[index:string]: BitsyItem} = {};
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
    public id: string = "";
    public name: string = "";
}

export class BitsyObjectBase extends BitsyResourceBase implements BitsyObject
{
    public graphic: BitsyGraphic = [];
    public palette: number = 1;
}

export class BitsyTile extends BitsyObjectBase
{
    public palette: number = 1;
}

export class BitsySprite extends BitsyObjectBase
{
    public palette: number = 2;
    public dialogueID: string = "";
}

export class BitsyItem extends BitsyObjectBase
{
    public dialogueID: string = "";
}

export type BitsyGraphicFrame = boolean[];
export type BitsyGraphic = BitsyGraphicFrame[];

export class BitsyPalette extends BitsyResourceBase
{
    public colors: number[] = [];

    public constructor()
    {
        super();

        this.colors = [];
    }

    public get background(): number { return this.colors[0]; }
    public get tile(): number { return this.colors[1]; }
    public get sprite(): number { return this.colors[2]; }
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
        
        return (parseInt(r) <<  0)
             | (parseInt(g) <<  8)
             | (parseInt(b) << 16)
             | (255         << 24);
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

        do
        {
            graphic.push(this.takeFrame());
        }
        while (this.checkLine(">"));
        
        object.graphic = graphic;
    }

    private takeTile(): void
    {
        const tile = new BitsyTile();
        this.takeResourceID(tile);
        this.takeObjectGraphic(tile);
        this.tryTakeResourceName(tile);
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
