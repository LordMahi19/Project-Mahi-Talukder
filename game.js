var config = {
    type: Phaser.AUTO,
    height: 600,
    width: 800,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game;
var player;
var stars;
var platforms;
var cursors;
var score = 0;
var scoreText;
var ghost;
var coins;
var gameOver = false;
var playerName;
var bullets;

document.getElementById('startButton').addEventListener('click', function() {
    this.style.display = 'none';
    document.getElementById('playerName').style.display = 'none';
    document.getElementById('gameInstructions').style.display = 'none';
    playerName = document.getElementById('playerName').value;
    game = new Phaser.Game(config);
});

function preload() {
    // Preload game assets
    this.load.image('sky', 'assets/clouds.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('ghost', 'assets/ghost.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.audio('collect', 'assets/collect.wav');
    this.load.image('bullet', 'assets/bullet.png');
}

function create() {
    // Create game elements

    this.add.image(400, 400, 'sky');

    platforms = this.physics.add.staticGroup();

    platforms.create(400, 568, 'platform').setScale(2).refreshBody();
    platforms.create(600, 400, 'platform');
    platforms.create(50, 250, 'platform');
    platforms.create(750, 220, 'platform');

    player = this.physics.add.sprite(100, 450, 'dude');

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    // Animation frames for the player
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();

    stars = this.physics.add.group({
        key: 'star',
        repeat: 5,
        setXY: { x: 12, y: 0, stepX: 140 }
    });

    coins = this.physics.add.group({
        key: 'coin',
        repeat: 5,
        setXY: { x: 70, y: 0, stepX: 140 }
    });

    // Initialize star and coin properties
    stars.children.iterate(function(child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
    coins.children.iterate(function(child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        child.setScale(0.5);
    });

    scoreText = this.add.text(16, 16, playerName + '\'s score: 0', { fontSize: '32px', fill: '#000' });

    ghost = this.physics.add.sprite(Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 600), 'ghost');

    ghost.setBounce(2);
    ghost.setCollideWorldBounds(false);
    ghost.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));
    ghost.setScale(0.5);
    ghost.body.updateFromGameObject();

    // Create an event to update the ghost's position
    this.time.addEvent({
        delay: 600,
        callback: function() {
            ghost.update();
        },
        loop: true,
    });

    bullets = this.physics.add.group();

    // Set up collisions and overlaps
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(coins, platforms);
    this.physics.add.collider(bullets, ghost, shootGhost, null, this);
    this.physics.add.collider(player, ghost, hitGhost, null, this);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.overlap(player, coins, collectCoin, null, this);
}

function update() {
    // Update game logic

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }

    // Update the ghost's position
    ghost.update = function() {
        if (ghost.x > 800) {
            ghost.x = 0;
        } else if (ghost.x < 0) {
            ghost.x = 800;
        }
        if (ghost.y > 600) {
            ghost.y = 0;
        } else if (ghost.y < 0) {
            ghost.y = 600;
        }
        ghost.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));
    };

    // Create bullets on mouse click
    var bulletLeft, bulletRight;
    if (game.input.activePointer.isDown) {
        bulletLeft = bullets.create(player.x, player.y, 'bullet');
        bulletRight = bullets.create(player.x, player.y, 'bullet');
        bulletLeft.body.allowGravity = false;
        bulletRight.body.allowGravity = false;
        if (game.input.activePointer.rightButtonDown()) {
            bulletLeft.setVelocityX(-400);
            bulletRight.setVelocityX(400);
        }
    }

    if (bulletLeft) {
        bulletLeft.setVelocityX(-400);
    }
    if (bulletRight) {
        bulletRight.setVelocityX(400);
    }

    // Check for win condition
    if (stars.countActive(true) === 0 && coins.countActive(true) === 0) {
        winGame.call(this);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText(playerName + '\'s score: ' + score);
    this.sound.play('collect');
}

function collectCoin(player, coin) {
    coin.disableBody(true, true);
    score += 20;
    scoreText.setText(playerName + '\'s score: ' + score);
    this.sound.play('collect');
}

var lostText;

function hitGhost(player, ghost) {
    // Handle game over
    if (!lostText) {
        lostText = this.add.text(config.width / 2, config.height / 2, '', { fontSize: '32px', fill: '#000' });
        lostText.setOrigin(0.5);
    }

    lostText.setText(playerName + '\'s Score: ' + score + '\nGOTCHA, you lost!');
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
}

function shootGhost(bullet, ghost) {
    // Handle shooting the ghost
    ghost.disableBody(true, true);
    bullet.disableBody(true, true);
}

var winText;

function winGame() {
    if (!winText) {
        winText = this.add.text(config.width / 2, config.height / 2, '', { fontSize: '32px', fill: '#000' });
        winText.setOrigin(0.5);
    }

    winText.setText(playerName + '\'s Score: ' + score + '\nCongratulations, you won!');

    this.physics.pause();
    player.setTint(0x00ff00);
    gameOver = true;
}
