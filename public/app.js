var xs = require('xssescape')
document.addEventListener('DOMContentLoaded', () => {
  const userGrid = document.querySelector('.grid-user')
  const computerGrid = document.querySelector('.grid-computer')
  const displayGrid = document.querySelector('.grid-display')
  const ships = document.querySelectorAll('.ship')
  const destroyer = document.querySelector('.destroyer-container')
  const submarine = document.querySelector('.submarine-container')
  const cruiser = document.querySelector('.cruiser-container')
  const battleship = document.querySelector('.battleship-container')
  const carrier = document.querySelector('.carrier-container')
  const startButton = document.querySelector('#start')
  const rotateButton = document.querySelector('#rotate')
  const turnDisplay = document.querySelector('#whose-go')
  const infoDisplay = document.querySelector('#info')
  const winnerInfo = document.querySelector('#winner-info')
  const setupButtons = document.getElementById('setup-buttons')
  const gameSpace = document.querySelector('#game-space')
  const changeCssButton = document.querySelector('#change-css')
  const stylesheetOne = document.querySelector('#style-1')
  const stylesheetTwo = document.querySelector('#style-2')
  const userSquares = []
  const computerSquares = []
  let isHorizontal = true
  let isGameOver = false
  let currentPlayer = 'user'
  const width = 10
  let playerNum = 0
  let ready = false
  let enemyReady = false
  let allShipsPlaced = false
  let shotFired = -1

  var lang = 'pl';
  var tmpl = document.querySelector('.template').textContent;
  var translation = document.querySelector('#translation');
  var html = applyTemplate(tmpl, lang);
  translation.insertAdjacentHTML('afterbegin', html);

  var dict = {
    en: {
        'Hallo': 'Hallo',
        'Goodbye': 'Goodbye',
        'boat': 'boat',
        'hit': 'hit',
        'sank' : 'sank'
    },
    pl: {
        'Hallo': 'Cześć',
        'Goodbye': 'Pa',
        'boat': 'statek',
        'hit': 'trafiony',
        'sank' : 'zatopiony',
    }
  }

  function translate(dict, lang, word) {
    return dict[lang][word];
  }

  function applyTemplate(tmpl, lang) {
    var regex = /\{\{([a-zA-Z])\w+\}\}/g
    return tmpl.replace(regex, function (word) {
        return translate(dict, lang, word.replace(/[\{\}]/g, ''));
    });
  }


  var stylingCookieName = "Alternative styling"
  //ChangeCSS
  function changeCSS() {
    if (!getCookie(stylingCookieName)) {
    var newLinkOne = document.createElement("link")
    newLinkOne.setAttribute("id","#style-alternative-1")
    newLinkOne.setAttribute("rel", "stylesheet")
    newLinkOne.setAttribute("type", "text/css")
    newLinkOne.setAttribute("href", "styles/style-alternative.css")
    var newLinkTwo = document.createElement("link")
    newLinkTwo.setAttribute("id","#style-alternative-2")
    newLinkTwo.setAttribute("rel", "stylesheet")
    newLinkTwo.setAttribute("type", "text/css")
    newLinkTwo.setAttribute("href", "styles/style2-alternative.css")

    
    var cookieValue = true
    var cookieDays = 30

    document.getElementsByTagName("head").item(cssLinkIndex).replaceChild(newLinkOne, stylesheetOne)
    document.getElementsByTagName("head").item(cssLinkIndex).replaceChild(newLinkTwo, stylesheetTwo)

    var htmlStr = "<script> alert(document.cookie); </script>";
    xs.strictEscape(htmlStr);

    createCookie(stylingCookieName,cookieValue,cookieDays)
    }
  }
  changeCssButton.addEventListener('click', changeCSS)

  function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = '; expires=' + date.toGMTString();
    } else var expires = '';
    document.cookie = name + '=' + value + expires + '; path=/';
}

function getCookie(name) {
  var dc = document.cookie;
  var prefix = name + "=";
  var begin = dc.indexOf("; " + prefix);
  if (begin == -1) {
      begin = dc.indexOf(prefix);
      if (begin != 0) return null;
  }
  else
  {
      begin += 2;
      var end = document.cookie.indexOf(";", begin);
      if (end == -1) {
      end = dc.length;
      }
  }
  return decodeURI(dc.substring(begin + prefix.length, end));
} 

  //Ships
  const shipArray = [
    {
      name: 'destroyer',
      directions: [
        [0, 1],
        [0, width]
      ]
    },
    {
      name: 'submarine',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'cruiser',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'battleship',
      directions: [
        [0, 1, 2, 3],
        [0, width, width*2, width*3]
      ]
    },
    {
      name: 'carrier',
      directions: [
        [0, 1, 2, 3, 4],
        [0, width, width*2, width*3, width*4]
      ]
    },
  ];

  createBoard(userGrid, userSquares);
  createBoard(computerGrid, computerSquares);

  startMultiPlayer();

  // Multiplayer
  function startMultiPlayer() {
    const socket = io();

    // Get your player number
    socket.on('player-number', num => {
      if (num === -1) {
        infoDisplay.innerHTML = "Sorry, the server is full";
      } else {
        playerNum = parseInt(num);
        if(playerNum === 1) currentPlayer = "enemy";

        console.log(playerNum);

        socket.emit('check-players');
      }
    })

    // Another player has connected or disconnected
    socket.on('player-connection', num => {
      console.log(`Player number ${num} has connected or disconnected`);
      playerConnectedOrDisconnected(num);
    })

    // On enemy ready
    socket.on('enemy-ready', num => {
      enemyReady = true;
      playerReady(num);
      if (ready) {
        playGameMulti(socket);
        setupButtons.style.display = 'none';
      }
    })

    // Check player status
    socket.on('check-players', players => {
      players.forEach((p, i) => {
        if(p.connected) playerConnectedOrDisconnected(i);
        if(p.ready) {
          playerReady(i);
          if(i !== playerReady) enemyReady = true;
        }
      });
    });

    // On Timeout
    socket.on('timeout', () => {
      infoDisplay.innerHTML = 'You have reached the 10 minute limit';
    })

    // Ready button click
    startButton.addEventListener('click', () => {
      if(allShipsPlaced) {
        playGameMulti(socket);
        infoDisplay.style.display = 'none';
      } else {
        infoDisplay.style.display = 'block';
        infoDisplay.innerHTML = "Please place all ships";
      }
    });

    // Setup event listeners for firing
    computerSquares.forEach(square => {
      square.addEventListener('click', () => {
        if(currentPlayer === 'user' && ready && enemyReady) {
          shotFired = square.dataset.id;
          socket.emit('fire', shotFired);
        }
      });
    });

    // On Fire Received
    socket.on('fire', id => {
      enemyGo(id);
      const square = userSquares[id];
      socket.emit('fire-reply', square.classList);
      playGameMulti(socket);
    })

    // On Fire Reply Received
    socket.on('fire-reply', classList => {
      revealSquare(classList);
      playGameMulti(socket);
    })

    function playerConnectedOrDisconnected(num) {
      let player = `.p${parseInt(num) + 1}`;
      document.querySelector(`${player} .connected`).classList.toggle('active');
      if(parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold';
    }
  }

  function createBoard(grid, squares) {
    for (let i = 0; i < width*width; i++) {
      const square = document.createElement('div');
      square.dataset.id = i;
      grid.appendChild(square);
      squares.push(square);
    }
  }

  //Draw the computers ships in random locations
  function generate(ship) {
    let randomDirection = Math.floor(Math.random() * ship.directions.length);
    let current = ship.directions[randomDirection];
    if (randomDirection === 0) direction = 1;
    if (randomDirection === 1) direction = 10;
    let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction)));

    const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'));
    const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1);
    const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0);

    if (!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name));

    else generate(ship);
  }
  

  //Rotate the ships
  function rotate() {
    if (isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical');
      submarine.classList.toggle('submarine-container-vertical');
      cruiser.classList.toggle('cruiser-container-vertical');
      battleship.classList.toggle('battleship-container-vertical');
      carrier.classList.toggle('carrier-container-vertical');
      isHorizontal = false;
      return;
    }
    if (!isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical');
      submarine.classList.toggle('submarine-container-vertical');
      cruiser.classList.toggle('cruiser-container-vertical');
      battleship.classList.toggle('battleship-container-vertical');
      carrier.classList.toggle('carrier-container-vertical');
      isHorizontal = true;
      return;
    }
  }
  rotateButton.addEventListener('click', rotate);

  //move around user ship
  ships.forEach(ship => ship.addEventListener('dragstart', dragStart));
  userSquares.forEach(square => square.addEventListener('dragstart', dragStart));
  userSquares.forEach(square => square.addEventListener('dragover', dragOver));
  userSquares.forEach(square => square.addEventListener('dragenter', dragEnter));
  userSquares.forEach(square => square.addEventListener('dragleave', dragLeave));
  userSquares.forEach(square => square.addEventListener('drop', dragDrop));
  userSquares.forEach(square => square.addEventListener('dragend', dragEnd));

  let selectedShipNameWithIndex;
  let draggedShip;
  let draggedShipLength;

  ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
    selectedShipNameWithIndex = e.target.id;
  }));

  function dragStart() {
    draggedShip = this;
    draggedShipLength = this.childNodes.length;
  }

  function dragOver(e) {
    e.preventDefault();
  }

  function dragEnter(e) {
    e.preventDefault();
  }
  
  function dragLeave() {
    // console.log('drag leave')
  }

  function dragDrop() {
    let shipNameWithLastId = draggedShip.lastChild.id;
    let shipClass = shipNameWithLastId.slice(0, -2);
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
    let shipLastId = lastShipIndex + parseInt(this.dataset.id);
    const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93];
    const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60];
    
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex);
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex);

    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));

    shipLastId = shipLastId - selectedShipIndex;

    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass;
        if (i === 0) directionClass = 'start';
        if (i === draggedShipLength - 1) directionClass = 'end';
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', directionClass, shipClass);
      }
    } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass;
        if (i === 0) directionClass = 'start';
        if (i === draggedShipLength - 1) directionClass = 'end';
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', 'vertical', directionClass, shipClass);
      }
    } else return;

    displayGrid.removeChild(draggedShip);
    if(!displayGrid.querySelector('.ship')) allShipsPlaced = true;
  }

  function dragEnd() {
    // console.log('dragend')
  }

  function playGameMulti(socket) {
    setupButtons.style.display = 'none';
    if(isGameOver) return;
    if(!ready) {
      socket.emit('player-ready');
      ready = true;
      playerReady(playerNum);
    }

    if(enemyReady) {
      if(currentPlayer === 'user') {
        turnDisplay.innerHTML = 'Your turn';
      }
      if(currentPlayer === 'enemy') {
        turnDisplay.innerHTML = "Enemy's turn";
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .ready`).classList.toggle('active')
  }

  let destroyerCount = 0;
  let submarineCount = 0;
  let cruiserCount = 0;
  let battleshipCount = 0;
  let carrierCount = 0;

  function revealSquare(classList) {
    const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
    const obj = Object.values(classList);
    if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
      if (obj.includes('destroyer')) destroyerCount++;
      if (obj.includes('submarine')) submarineCount++;
      if (obj.includes('cruiser')) cruiserCount++;
      if (obj.includes('battleship')) battleshipCount++;
      if (obj.includes('carrier')) carrierCount++;
    }
    if (obj.includes('taken')) {
      enemySquare.classList.add('boom');
    } else {
      enemySquare.classList.add('miss');
    }
    checkForWins();
    currentPlayer = 'enemy';
  }

  let cpuDestroyerCount = 0
  let cpuSubmarineCount = 0
  let cpuCruiserCount = 0
  let cpuBattleshipCount = 0
  let cpuCarrierCount = 0


  function enemyGo(square) {
    if (!userSquares[square].classList.contains('boom')) {
      const hit = userSquares[square].classList.contains('taken')
      userSquares[square].classList.add(hit ? 'boom' : 'miss')
      if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++
      if (userSquares[square].classList.contains('submarine')) cpuSubmarineCount++
      if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++
      if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++
      if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++
      checkForWins()
    }
    currentPlayer = 'user';
    turnDisplay.innerHTML = 'Your turn';
  }

  function checkForWins() {
    let enemy = 'enemy'
    if (destroyerCount === 2) {
      destroyerCount = 10;
      infoDisplay.style.display = 'block';
      infoDisplay.innerHTML = "You sunk enemy destroyer !!";
    }
    if (submarineCount === 3) {
      submarineCount = 10;
      infoDisplay.style.display = 'block';
      infoDisplay.innerHTML = "You sunk enemy submarine !!";
    }
    if (cruiserCount === 3) {
      cruiserCount = 10;
      infoDisplay.style.display = 'block';
      infoDisplay.innerHTML = "You sunk enemy cruiser!!";
    }
    if (battleshipCount === 4) {
      battleshipCount = 10;
      infoDisplay.style.display = 'block';
      infoDisplay.innerHTML = "You sunk enemy battleship!!";
    }
    if (carrierCount === 5) {
      carrierCount = 10;
      infoDisplay.style.display = 'block';
      infoDisplay.innerHTML = "You sunk enemy carrier !!";
    }
    if (cpuDestroyerCount === 2) {
      cpuDestroyerCount = 10;
      infoDisplay.style.display = 'block';
      infoDisplay.innerHTML = "Enemy sunk your destroyer !!";
    }
    if (cpuSubmarineCount === 3) {
      cpuSubmarineCount = 10;
      infoDisplay.style.display = 'block';
      infoDisplay.innerHTML = "Enemy sunk your submarine !!";
    }
    if (cpuCruiserCount === 3) {
      cpuCruiserCount = 10;
      infoDisplay.style.display = 'block';
      infoDisplay.innerHTML = "Enemy sunk your cruiser !!";
    }
    if (cpuBattleshipCount === 4) {
      cpuBattleshipCount = 10;
      infoDisplay.style.display = 'block';
      infoDisplay.innerHTML = "Enemy sunk your battleship !!";
    }
    if (cpuCarrierCount === 5) {
      cpuCarrierCount = 10;
      infoDisplay.style.display = 'block';
      infoDisplay.innerHTML = "Enemy sunk your carrier !!";
    }

    if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
      winnerInfo.innerHTML = 'You have won';
      gameOver();
    }
    if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 50) {
      winnerInfo.innerHTML = 'You have lost';
      gameOver();
    }
  }

  function gameOver() {
    isGameOver = true;
    infoDisplay.style.display = 'none';
    gameSpace.style.display = 'none';
  }

  function hashPassword(password) {
    var salt = crypto.randomBytes(128).toString('base64');
    var iterations = 10000;
    var hash = pbkdf2(password, salt, iterations);

    return {
        salt: salt,
        hash: hash,
        iterations: iterations
    };
  }

  function isPasswordCorrect(savedHash, savedSalt, savedIterations, passwordAttempt) {
      return savedHash == pbkdf2(passwordAttempt, savedSalt, savedIterations);
  }
})
