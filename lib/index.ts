function parsePosition(str: string)
{
    const [x, y] = str.split(",").map(n => parseInt(n, 10));
    return { x, y };
}

export class BitsyWorld
{
    public title: string = "";
    public bitsyVersion: string = "";
    public roomFormat: number = 1;
    public rooms: Record<string, BitsyRoom> = {};
    public palettes: Record<string, BitsyPalette> = {};
    public tiles: Record<string, BitsyTile> = {};
    public sprites: Record<string, BitsySprite> = {};
    public items: Record<string, BitsyItem> = {};
    public dialogue: Record<string, BitsyDialogue> = {};
    public endings: Record<string, BitsyEnding> = {};
    public variables: Record<string, BitsyVariable> = {};

    public toString()
    {
        return `${this.title}

# BITSY VERSION ${this.bitsyVersion}

! ROOM_FORMAT ${this.roomFormat}

${[
    this.palettes,
    this.rooms,
    this.tiles,
    this.sprites,
    this.items,
    this.dialogue,
    this.endings,
    this.variables
]
    .map(map => Object.values(map).map(i => i.toString()).join('\n\n'))
    .filter(i => i).join('\n\n')}`
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

    get type()
    {
        const brb = <typeof BitsyResourceBase>this.constructor;
        return brb;
    }
    public toString()
    {
        return `${this.type.typeName} ${this.id}`;
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

    constructor()
    {
        super();
        this.palette = this.type.paletteDefault;
    }
    get type()
    {
        const bob = <typeof BitsyObjectBase>this.constructor;
        return bob;
    }
    public toString()
    {
        const props = [];
        props.push(super.toString());
        props.push(this.graphic.map(g => g.map(b => b ? 1 : 0).join('').replace(/(.{8})/g, '$1\n').trim()).join('\n>\n'));
        if (this.name)
        {
            props.push(`NAME ${this.name}`);
        }
        if (this.dialogueID)
        {
            props.push(`DLG ${this.dialogueID}`);
        }
        if (this.position)
        {
            props.push(`POS ${this.position.room} ${this.position.x},${this.position.y}`);
        }
        if (this.wall)
        {
            props.push(`WAL true`);
        }
        if (this.palette !== this.type.paletteDefault)
        {
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

export type Color = { r: number, g: number, b: number };
export class BitsyPalette extends BitsyResourceBase
{
    static typeName: string = "PAL";
    public colors: Color[] = [];

    public get background(): Color { return this.colors[0]; }
    public get tile(): Color { return this.colors[1]; }
    public get sprite(): Color { return this.colors[2]; }
    public toString()
    {
        return `${[
            super.toString(),
            this.name && `NAME ${this.name}`,
            ...this.colors.map(({r, g, b}) => `${r},${g},${b}`)
        ].filter(i => i).join('\n')}`;
    }
}

export class BitsyRoom extends BitsyResourceBase
{
    static typeName: string = "ROOM";
    public tiles: string[][] = [];
    public legacyWalls: string[] = [];
    public items: { id: string, x: number, y: number }[] = [];
    public exits: { from: { x: number, y: number }, to: { room: string, x: number, y: number }, transition: string, dialog: string }[] = [];
    public endings: { id: string, x: number, y: number }[] = [];
    public palette: string = "";

    public toString()
    {
        return [
            super.toString(),
            ...this.tiles.map(row => row.join(",")),
            this.name && `NAME ${this.name}`,
            this.legacyWalls.length && `WAL ${this.legacyWalls.join(',')}`,
            ...this.items.map(({ id, x, y }) => `ITM ${id} ${x},${y}`),
            ...this.exits.map(({ from, to, transition, dialog }) => ['EXT', `${from.x},${from.y}`, to.room, `${to.x},${to.y}`, transition && `FX ${transition}`, dialog && `DLG ${dialog}`].filter(i => i).join(' ')),
            ...this.endings.map(({ id, x, y }) => `END ${id} ${x},${y}`),
            this.palette && `PAL ${this.palette}`,
        ].filter(i => i).join('\n');
    }
}

export class BitsyDialogue extends BitsyResourceBase
{
    static typeName: string = "DLG";
    public script: string = "";

    public toString()
    {
        return `${[
            super.toString(),
            this.script,
            this.name && `NAME ${this.name}`,
        ].filter(i => i).join('\n')}`;
    }
}

export class BitsyEnding extends BitsyResourceBase
{
    static typeName: string = "END";
    public script: string = "";

    public toString()
    {
        return `${super.toString()}
${this.script}`;
    }
}

export class BitsyVariable extends BitsyResourceBase
{
    static typeName: string = "VAR";
    public value: string = "";

    public toString()
    {
        return `${super.toString()}
${this.value}`;
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

        this.world.title = this.takeLine();
        while (!this.done && !this.checkLine("# BITSY VERSION "))
        {
            this.skipLine();
        }
        this.world.bitsyVersion = this.takeSplitOnce("# BITSY VERSION ")[1];
        while (!this.done && !this.checkLine("! ROOM_FORMAT "))
        {
            this.skipLine();
        }
        this.world.roomFormat = parseInt(this.takeSplitOnce("! ROOM_FORMAT ")[1], 10);

        while (!this.done)
        {
                 if (this.checkLine("PAL")) this.takePalette();
            else if (this.checkLine("ROOM")) this.takeRoom();
            else if (this.checkLine("TIL")) this.takeTile();
            else if (this.checkLine("SPR")) this.takeSprite();
            else if (this.checkLine("ITM")) this.takeItem();
            else if (this.checkLine("END")) this.takeEnding();
            else if (this.checkLine("DLG")) this.takeDialogue();
            else if (this.checkLine("VAR")) this.takeVariable();
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
        return this.currentLine ? this.currentLine.startsWith(check) : false;
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

    private takeSplitOnce(delimiter: string): [string, string]
    {
        const line = this.takeLine();
        const i = line.indexOf(delimiter);

        return [line.slice(0, i), line.slice(i + delimiter.length)];
    }

    private takeColor(): Color
    {
        const [r, g, b] = this.takeLine().split(',').map((component) => parseInt(component, 10));
        return { r, g, b };
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

    private tryTakeObjectDialogueID(object: { "dialogueID": string })
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
            sprite.position = { room, ...parsePosition(pos) };
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

    private takeRoom(): void
    {
        const room = new BitsyRoom();
        this.takeResourceID(room);
        this.takeRoomTiles(room);
        this.tryTakeResourceName(room);
        while (this.checkLine("WAL"))
        {
            this.takeRoomLegacyWalls(room);
        }
        while (this.checkLine("ITM"))
        {
            this.takeRoomItem(room);
        }
        while (this.checkLine("EXT"))
        {
            this.takeRoomExit(room);
        }
        while (this.checkLine("END"))
        {
            this.takeRoomEnding(room);
        }
        this.takeRoomPalette(room);

        this.world.rooms[room.id] = room;
    }

    private takeRoomTiles(room: BitsyRoom)
    {
        for (let i = 0; i < 16; ++i)
        {
            const row = this.takeSplit(",");
            room.tiles.push(row);
        }
    }

    private takeRoomLegacyWalls(room: BitsyRoom)
    {
        const walls = this.takeSplitOnce(" ")[1];
        room.legacyWalls.push(...walls.split(","));
    }

    private takeRoomItem(room: BitsyRoom)
    {
        const item = this.takeSplitOnce(" ")[1];
        const [id, pos] = item.split(" ");
        room.items.push({ id, ...parsePosition(pos) });
    }

    private takeRoomExit(room: BitsyRoom)
    {
        const exit = this.takeSplitOnce(" ")[1];
        const [from, toRoom, toPos, ...rest] = exit.split(" ");
        const [, transition, dialog] = rest.join(' ').match(/(?:FX\s(.*))?\s?(?:DLG\s(.*))?/) || [];
        room.exits.push({ from: parsePosition(from), to: { room: toRoom, ...parsePosition(toPos) }, transition, dialog });
    }

    private takeRoomEnding(room: BitsyRoom)
    {
        const ending = this.takeSplitOnce(" ")[1];
        const [id, pos] = ending.split(" ");
        room.endings.push({ id, ...parsePosition(pos) });
    }

    private takeRoomPalette(room: BitsyRoom)
    {
        room.palette = this.takeSplitOnce(" ")[1];
    }

    private takeDialogueScript(dialogue: BitsyDialogue)
    {
        if (this.checkLine('"""'))
        {
            const lines = [this.takeLine()];
            while (!this.checkLine('"""'))
            {
                lines.push(this.takeLine());
            }
            lines.push(this.takeLine());
            dialogue.script = lines.join('\n');
        } else dialogue.script = this.takeLine();
        this.tryTakeResourceName(dialogue);
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
            if (moreFrames)
            {
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

    private takeEnding(): void
    {
        const ending = new BitsyEnding();
        this.takeResourceID(ending);
        this.takeDialogueScript(ending);

        this.world.endings[ending.id] = ending;
    }

    private takeDialogue(): void
    {
        const dialogue = new BitsyDialogue();
        this.takeResourceID(dialogue);
        this.takeDialogueScript(dialogue);

        this.world.dialogue[dialogue.id] = dialogue;
    }

    private takeVariable(): void
    {
        const variable = new BitsyVariable();
        this.takeResourceID(variable);
        variable.value = this.takeLine();

        this.world.variables[variable.id] = variable;
    }
}
