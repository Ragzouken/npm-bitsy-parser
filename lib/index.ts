export class BitsyWorld
{
    public palettes: {[index:string]: BitsyPalette} = {};
    public tiles: {[index:string]: BitsyTile} = {};
}

export class BitsyTile
{
    public id: string = "";
    public name: string = "";
    public graphic: BitsyGraphic = [];
}

export type BitsyGraphicFrame = boolean[];
export type BitsyGraphic = BitsyGraphicFrame[];

export class BitsyPalette
{
    public id: string = "";
    public name: string = "";
    public colors: number[] = [];

    public constructor()
    {
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
        
        return (parseInt(r) << 24)
             | (parseInt(g) << 16)
             | (parseInt(b) <<  8)
             | 255;
    }

    private tryTakeName(object: {"name": string})
    {
        object.name = this.checkLine("NAME") ? this.takeSplitOnce(" ")[1] : "";
    }

    private takePalette(): void
    {
        const palette = new BitsyPalette();
        palette.id = this.takeSplitOnce(" ")[1];
        
        this.tryTakeName(palette);

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

    private takeGraphic(): BitsyGraphic
    {
        const graphic: BitsyGraphic = [];

        do
        {
            graphic.push(this.takeFrame());
        }
        while (this.checkLine(">"));
        
        return graphic;
    }

    private takeTile(): void
    {
        const tile = new BitsyTile();
        tile.id = this.takeSplitOnce(" ")[1];

        tile.graphic = this.takeGraphic();
        this.tryTakeName(tile);

        this.world.tiles[tile.id] = tile;
    }
}
