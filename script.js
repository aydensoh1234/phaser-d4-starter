let myGame = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 
      },
      // debug: true
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(myGame);

function preload() {
  this.load.json('levelData', 'assets/levelData.json');
  this.load.image('ground', 'assets/newground.png');
  this.load.image('block', 'assets/stone.png');
  //this.load.image('goal', 'assets/crusty.png');

  // load spritesheets
  this.load.spritesheet('player', 'assets/newplayer.png', {
    frameWidth: 32,
    frameHeight: 30,
    margin: 0,
    spacing: 0
  });

  this.load.spritesheet('fire', 'assets/fire_spritesheet.png', {
    frameWidth: 20,
    frameHeight: 21,
    margin: 1,
    spacing: 1
  });

  this.input.on('pointerdown', function(pointer){
    console.log(pointer.x, pointer.y);
  });
}

function create() {
  // walking animation
  this.anims.create({
    key: 'walking',
    frames: this.anims.generateFrameNames('player', {
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    }),
    frameRate: 20,
    yoyo: true,
    repeat: -1
  });

  // fire animation
  this.anims.create({
    key: 'burning',
    frames: this.anims.generateFrameNames('fire', {
      frames: [0, 1]
    }),
    frameRate: 4,
    repeat: -1
  }); 

  this.platforms = this.add.group();

  this.levelData = this.cache.json.get('levelData');

  // CREATE ALL THE PLATFORMS
  for (let i = 0; i < this.levelData.platforms.length; i++) {
    let curr = this.levelData.platforms[i];
    let newObj;
    if (curr.numTiles == 1) {
      newObj = this.add.sprite(curr.x, curr.y, curr.key).setOrigin(0);
    }
    else {
      let width = this.textures.get(curr.key).get(0).width;
      let height = this.textures.get(curr.key).get(0).height;
      newObj = this.add.tileSprite(curr.x, curr.y, curr.numTiles * width, height, curr.key).setOrigin(0);
    }
    this.physics.add.existing(newObj, true);
    this.platforms.add(newObj);

  }

  // CREATE ALL THE FIRE
  this.fires = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });
  for (let i = 0; i < this.levelData.fires.length; i++) {
    let curr = this.levelData.fires[i];
    let newObj = this.add.sprite(curr.x, curr.y, 'fire').setOrigin(0);
    this.physics.add.existing(newObj);
    newObj.body.allowGravity = false;
    newObj.body.immovable = true;
    newObj.anims.play('burning');
    this.fires.add(newObj);
  }

  this.player = this.add.sprite(this.levelData.player.x, this.levelData.player.y, 'player', 3);
  this.physics.add.existing(this.player);

  this.goal = this.add.sprite(this.levelData.goal.x, this.levelData.goal.y, 'goal');
  this.physics.add.existing(this.goal);

  this.physics.add.collider([this.player, this.goal], this.platforms);

  this.cameras.main.setBounds(0,0,360,700);
  this.cameras.main.startFollow(this.player);

  function restartGame(sourceSprite, targetSprite) {
    this.cameras.main.fade(500);

    this.cameras.main.on('camerafadeoutcomplete', function (camera, effect){
      this.scene.restart();
    }, this);
  }

  this.physics.add.overlap(this.player, [this.fires, this.goal], restartGame, null, this);

  this.physics.world.bounds.width = 360;
  this.physics.world.bounds.height = 700;
  this.player.body.setCollideWorldBounds(true);

  // keyboard input
  this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  this.playerSpeed = 150;
  let onGround = this.player.body.blocked.down || this.player.body.touching.down;

  // move to the left
  if (this.cursors.left.isDown) {
    this.player.flipX = true;
    this.player.body.setVelocityX(-this.playerSpeed);
    if (!this.player.anims.isPlaying)
      this.player.anims.play('walking');
  }

  // movement to the right
  else if (this.cursors.right.isDown) {
    this.player.flipX = false;
    this.player.body.setVelocityX(this.playerSpeed);
    if (!this.player.anims.isPlaying)
      this.player.anims.play('walking');
  }

  else if (onGround && this.cursors.up.isDown) {
    this.player.body.setVelocityY(-600);
  }

  else {
    // make the player stop
    this.player.body.setVelocityX(0);
    this.player.anims.stop('walking');
    this.player.setFrame(3);
  }


}