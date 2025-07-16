const gameConfig = {
    framerate: 30,
    canvasWidth: 800,
    canvasHeight: 800,

    defaultLayout: 6,
}

const layouts = [
    {
        board: `0000000
                0011100
                0111100
                0111110
                0111100
                0011100
                0000000`,
        stacks: [
        ],
        numPalette: 3,
        offset: {x: 100, y: -70},
        name: 'basic unlimited',
        active: true,
    },
    {
        name: 'game replay',
        active: false,
        board: `01111100
                01111110
                11000110
                01111110
                01111100
        `,
        stacks: [
            {x: 2, y: 1, stack: [4,4,4,2,2,2,0,0,0]},
            {x: 3, y: 1, stack: [0,0,0,3,3,3,4,4,4]},
            {x: 4, y: 1, stack: [2,2,2,4,4,4,1,1,1]},
            {x: 5, y: 1, stack: [1,1,1,3,3,3,0,0,0]},
            {x: 1, y: 2, stack: [3,3,3,1,1,1,2,2,2]},
            {x: 5, y: 2, stack: [0,0,0,2,2,2,3,3,3]},
            {x: 2, y: 3, stack: [2,2,2,0,0,0,1,1,1]},
            {x: 3, y: 3, stack: [1,1,1,4,4,4,3,3,3]},
            {x: 4, y: 3, stack: [3,3,3,0,0,0,4,4,4]},
            {x: 5, y: 3, stack: [4,4,4,1,1,1,2,2,2]}
        ],
        numPalette: 3,
        offset: {x: 0, y: 0},
        paletteStacks: [
            [2,2,2,0,0],
            [5,5,5,5,5],
            [0,0,0,0],
            [0,5,5,4,4],
            [5,5,4,4,4,2],
            [3,3,3,3,3,3],
            [2,1,1],
            [2,2,2,4,4,4],
            [1,3,4],
            [4,4,4,1],
            [4,4,3,3,3],
            [0,6,6],
            [2,2],
            [5,5,1],
            [2,1,1,1,1],
            [3,3,1,6],
            [3,3,3,3,3,3],
            [6,2],
            [1,1,1,1],
            [3,3,3],
            [2,2,2,6,6,6],
            [1,1,1,7],
            [3,3],
            [3,3,4,4,4,4],
            [4,1,1],
            [3,3],
            [6,6,3,3,1],
            [0,0,0,0,5,5],
            [6,6,6,4,4],
            [0,4,4],
            [0,0,0,0,0,0,0],
            [4,4,0,0,0],
            [1,1,1,1,1,1],
            [4,4,4],
            [2,3,5],
            [5,5,5],
            [3,3,7,7],
            [7,7,6,6,6],
            [5,5,4,4,0,0],
            [2,2],
            [6,4,4],
            [4,4,4],
            [3,3,3,3,3],
            [3,3,6,6,0,0],
            [5,6,2,2,2],
            [2,7,1,1],
            [6,6,6,6],
            [5,5,7,7,7]
        ]
    },
    {
        board: `0000000
                0011100
                0011000
                0110110
                0111100
                0010100
                0000000`,
        name: 'small unlimited',
        active: true,
        stacks: [],
        numPalette: 3,
        offset: {x: 100, y: -70},
    },
    {
        board: `000000000000
                000111111000
                001111111000
                001111111100
                011111111100
                011111111110
                011111111100
                001111111100
                001111111000
                000000000000`,
        name: 'giant empty',
        active: false,
        stacks: [
        ],
        tileHp: 2,
        numPalette: 4,
        startingRadius: 35,
        offset: {x: 100, y: -140},
    },
    {
        board: `000000000000
                000111111000
                001111111000
                001111111100
                011111111100
                011111111110
                011111111100
                001111111100
                001111111000
                000000000000`,
        name: 'giant board',
        active: true,
        startingRadius: 35,
        offset: {x: 100, y: -140},
        stacks: [
            // {x: 1, y: 1, stack: ['R', 3, 8]},
            // {x: 2, y: 1, stack: ['R', 3, 8]},
            {x: 3, y: 1, stack: ['R', 3, 8]},
            {x: 4, y: 1, stack: ['R', 3, 8]},
            {x: 5, y: 1, stack: ['R', 3, 8]},
            {x: 6, y: 1, stack: ['R', 3, 8]},
            {x: 7, y: 1, stack: ['R', 3, 8]},
            {x: 8, y: 1, stack: ['R', 3, 8]},
            // {x: 9, y: 1, stack: ['R', 3, 8]},
            // {x: 10, y: 1, stack: ['R', 3, 8]},
            // {x: 0, y: 2, stack: ['R', 3, 8]},
            // {x: 1, y: 2, stack: ['R', 3, 8]},
            {x: 2, y: 2, stack: ['R', 3, 8]},
            {x: 3, y: 2, stack: ['R', 9, 8]},
            {x: 4, y: 2, stack: ['R', 3, 8]},
            {x: 5, y: 2, stack: ['R', 3, 8]},
            {x: 6, y: 2, stack: ['R', 3, 8]},
            {x: 7, y: 2, stack: ['R', 9, 8]},
            {x: 8, y: 2, stack: ['R', 3, 8]},
            // {x: 9, y: 2, stack: ['R', 3, 8]},
            // {x: 0, y: 3, stack: ['R', 3, 8]},
            {x: 2, y: 3, stack: ['R', 3, 7]},
            {x: 3, y: 3, stack: ['R', 9, 7]},
            {x: 4, y: 3, stack: ['R', 9, 7]},
            {x: 5, y: 3, stack: ['R', 3, 7]},
            {x: 6, y: 3, stack: ['R', 3, 7]},
            {x: 7, y: 3, stack: ['R', 9, 7]},
            {x: 8, y: 3, stack: ['R', 9, 7]},
            {x: 9, y: 3, stack: ['R', 3, 7]},
            // {x: 9, y: 3, stack: ['R', 3, 8]},
            // {x: 0, y: 4, stack: ['R', 3, 8]},
            {x: 1, y: 4, stack: ['R', 3, 6]},
            {x: 2, y: 4, stack: ['R', 3, 6]},
            {x: 3, y: 4, stack: ['R', 3, 6]},
            {x: 4, y: 4, stack: ['R', 3, 6]},
            {x: 5, y: 4, stack: ['R', 3, 6]},
            {x: 6, y: 4, stack: ['R', 3, 6]},
            {x: 7, y: 4, stack: ['R', 3, 6]},
            {x: 8, y: 4, stack: ['R', 3, 6]},
            {x: 9, y: 4, stack: ['R', 3, 6]},
            {x: 1, y: 5, stack: ['R', 3, 5]},
            {x: 2, y: 5, stack: ['R', 3, 5]},
            {x: 3, y: 5, stack: ['R', 3, 5]},
            {x: 4, y: 5, stack: ['R', 3, 5]},
            {x: 5, y: 5, stack: ['R', 3, 5]},
            {x: 6, y: 5, stack: ['R', 3, 5]},
            {x: 7, y: 5, stack: ['R', 3, 5]},
            {x: 8, y: 5, stack: ['R', 3, 5]},
            {x: 9, y: 5, stack: ['R', 3, 5]},
            {x: 10, y: 5, stack: ['R', 3, 5]},
            // {x: 0, y: 6, stack: ['R', 3, 8]},
            {x: 1, y: 6, stack: ['R', 3, 5]},
            {x: 2, y: 6, stack: ['R', 3, 4]},
            {x: 3, y: 6, stack: ['R', 3, 4]},
            // {x: 4, y: 6, stack: ['R', 3, 8]},
            // {x: 5, y: 6, stack: ['R', 3, 8]},
            // {x: 6, y: 6, stack: ['R', 3, 8]},
            {x: 7, y: 6, stack: ['R', 3, 4]},
            {x: 8, y: 6, stack: ['R', 3, 4]},
            {x: 9, y: 6, stack: ['R', 3, 5]},
            // {x: 0, y: 7, stack: ['R', 3, 8]},
            {x: 2, y: 7, stack: ['R', 3, 4]},
            {x: 3, y: 7, stack: ['R', 3, 4]},
            // {x: 3, y: 7, stack: ['R', 3, 8]},
            // {x: 4, y: 7, stack: ['R', 3, 8]},
            // {x: 5, y: 7, stack: ['R', 3, 8]},
            // {x: 6, y: 7, stack: ['R', 3, 8]},
            {x: 8, y: 7, stack: ['R', 3, 4]},
            {x: 9, y: 7, stack: ['R', 3, 4]},
            // {x: 9, y: 7, stack: ['R', 3, 8]},
            // {x: 0, y: 8, stack: ['R', 3, 8]},
            // {x: 1, y: 8, stack: ['R', 3, 8]},
            {x: 2, y: 8, stack: ['R', 3, 3]},
            // {x: 3, y: 8, stack: ['R', 3, 8]},
            // {x: 4, y: 8, stack: ['R', 3, 8]},
            // {x: 5, y: 8, stack: ['R', 3, 8]},
            // {x: 6, y: 8, stack: ['R', 3, 8]},
            // {x: 7, y: 8, stack: ['R', 3, 8]},
            {x: 8, y: 8, stack: ['R', 3, 3]},
            // {x: 9, y: 8, stack: ['R', 3, 8]},
        ],
        tileHp: 2,
        numPalette: 4
    },
    {
        board: `0000000000
                0011111100
                0111111100
                0111111110
                1111111110
                0111111110
                0111111100
                0011111100
                0000000000`,
        offset: {x: 100, y: -120},
        startingRadius: 40,
        name: 'big board',
        active: true,
        stacks: [
            // {x: 0, y: 1, stack: ['R', 3, 8]},
            {x: 2, y: 1, stack: ['R', 3, 8]},
            {x: 3, y: 1, stack: ['R', 3, 8]},
            {x: 4, y: 1, stack: ['R', 3, 8]},
            {x: 5, y: 1, stack: ['R', 3, 8]},
            {x: 6, y: 1, stack: ['R', 3, 8]},
            {x: 7, y: 1, stack: ['R', 3, 8]},
            // {x: 7, y: 1, stack: ['R', 3, 8]},
            // {x: 8, y: 1, stack: ['R', 3, 8]},
            // {x: 0, y: 2, stack: ['R', 3, 8]},
            {x: 1, y: 2, stack: ['R', 3, 8]},
            {x: 2, y: 2, stack: ['R', 9, 8]},
            {x: 3, y: 2, stack: ['R', 9, 8]},
            {x: 4, y: 2, stack: ['R', 3, 8]},
            {x: 5, y: 2, stack: ['R', 9, 8]},
            {x: 6, y: 2, stack: ['R', 9, 8]},
            {x: 7, y: 2, stack: ['R', 3, 8]},
            // {x: 8, y: 2, stack: ['R', 3, 8]},
            {x: 1, y: 3, stack: ['R', 3, 7]},
            {x: 2, y: 3, stack: ['R', 3, 7]},
            {x: 3, y: 3, stack: ['R', 9, 7]},
            {x: 4, y: 3, stack: ['R', 3, 7]},
            {x: 5, y: 3, stack: ['R', 3, 7]},
            {x: 6, y: 3, stack: ['R', 9, 7]},
            {x: 7, y: 3, stack: ['R', 3, 7]},
            {x: 8, y: 3, stack: ['R', 3, 7]},
            // {x: 8, y: 3, stack: ['R', 3, 8]},
            {x: 0, y: 4, stack: ['R', 3, 6]},
            {x: 1, y: 4, stack: ['R', 3, 6]},
            {x: 2, y: 4, stack: ['R', 3, 6]},
            {x: 3, y: 4, stack: ['R', 3, 6]},
            {x: 4, y: 4, stack: ['R', 3, 6]},
            {x: 5, y: 4, stack: ['R', 3, 6]},
            {x: 6, y: 4, stack: ['R', 3, 6]},
            {x: 7, y: 4, stack: ['R', 3, 6]},
            {x: 8, y: 4, stack: ['R', 3, 6]},
            {x: 1, y: 5, stack: ['R', 3, 4]},
            {x: 2, y: 5, stack: ['R', 3, 4]},
            {x: 3, y: 5, stack: ['R', 3, 4]},
            {x: 4, y: 5, stack: ['R', 3, 4]},
            {x: 5, y: 5, stack: ['R', 3, 4]},
            {x: 6, y: 5, stack: ['R', 3, 4]},
            {x: 7, y: 5, stack: ['R', 3, 4]},
            {x: 8, y: 5, stack: ['R', 3, 4]},
            // {x: 8, y: 5, stack: ['R', 3, 8]},
            // {x: 0, y: 6, stack: ['R', 3, 8]},
            {x: 1, y: 6, stack: ['R', 3, 4]},
            {x: 2, y: 6, stack: ['R', 3, 4]},
            // {x: 3, y: 6, stack: ['R', 3, 8]},
            // {x: 4, y: 6, stack: ['R', 3, 8]},
            // {x: 5, y: 6, stack: ['R', 3, 8]},
            {x: 6, y: 6, stack: ['R', 3, 4]},
            {x: 7, y: 6, stack: ['R', 3, 4]},
            // {x: 8, y: 6, stack: ['R', 3, 8]},
            // {x: 0, y: 7, stack: ['R', 3, 8]},
            {x: 2, y: 7, stack: ['R', 3, 3]},
            // {x: 2, y: 7, stack: ['R', 3, 8]},
            // {x: 3, y: 7, stack: ['R', 3, 8]},
            // {x: 4, y: 7, stack: ['R', 3, 8]},
            // {x: 5, y: 7, stack: ['R', 3, 8]},
            {x: 7, y: 7, stack: ['R', 3, 3]},
            // {x: 7, y: 7, stack: ['R', 3, 8]},
            // {x: 8, y: 7, stack: ['R', 3, 8]},
        ],
        tileHp: 2,
        numPalette: 3
    },
];

const Colors = {
    RED: '#ff0000',
    GREEN: '#00ff00',
    BLUE: '#0000ff',
    YELLOW: '#ffff00',
    TEAL: '#00ffff',
    MAGENTA: '#ff00ff',
    WHITE: '#ffffff',
    BLACK: '#333333',
    BROWN: '#AA6633',
    PINK: '#FF99BB',

    INDEXED: [],
}

Colors.INDEXED = [
    Colors.RED,
    Colors.BLUE,
    Colors.GREEN,
    Colors.YELLOW,
    Colors.TEAL,
    Colors.MAGENTA,
    Colors.WHITE,
    Colors.BLACK,
    Colors.BROWN,
    Colors.PINK,
];