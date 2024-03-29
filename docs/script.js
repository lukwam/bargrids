// Javascript file for Bargrids

// set xml namespaces
const svgns = "http://www.w3.org/2000/svg"
const xlinkns = "http://www.w3.org/1999/xlink";
const xmlns = "http://www.w3.org/2000/xmlns/";

// define a basic puzzle
let puzzle = {
  //title
  title: "Title",

  // grid dimensions
  cols: 8,
  rows: 8,

  // size of an individual square in the grid
  size: 50,

  // fonts
  answer_font_family: "Helvetica",
  number_font_family: "Helvetica",

  // content
  answers: [],
  numbers: [],

  // bars
  across_bars: [],
  down_bars: [],
  bar_join_caps: true,

  // additional elements
  blanks: [],
  blocks: [],
  circles: [],
  shade_circles: [],
  shade_squares: [],
}

// state data
let state = {
  last_answer_input: null,
  last_number_input: null,
  last_number: 0,
  layers: {
    answers: true,
    bars: true,
    blocks: true,
    circles: true,
    gridlines: true,
    numbers: true,
    shadecircles: true,
    shadequares: true,
  },
  rebus: false,
}

// demo puzzle
function loadDemoPuzzle() {
  puzzle.title = "For Beginners";
  puzzle.cols = 13;
  puzzle.rows = 13;
  puzzle.bar_join_caps = true;
  puzzle.answers = [
    ["E", "A", "G", "E", "R", "A", "R", "P", "A", "U", "L", "I", "N"],
    ["B", "R", "E", "N", "T", "M", "A", "I", "L", "B", "O", "A", "T"],
    ["I", "C", "A", "R", "I", "O", "U", "S", "L", "Y", "W", "R", "A"],
    ["R", "O", "V", "I", "S", "O", "S", "O", "E", "O", "W", "A", "N"],
    ["T", "T", "E", "R", "T", "S", "N", "D", "O", "W", "I", "N", "G"],
    ["H", "I", "V", "E", "R", "E", "D", "I", "N", "A", "T", "A", "L"],
    ["I", "C", "A", "N", "O", "V", "I", "C", "E", "S", "T", "A", "E"],
    ["B", "E", "S", "E", "H", "E", "E", "A", "F", "I", "E", "S", "T"],
    ["E", "A", "T", "H", "E", "R", "S", "B", "A", "S", "D", "E", "T"],
    ["L", "O", "A", "T", "E", "S", "E", "L", "F", "S", "A", "M", "E"],
    ["A", "B", "T", "O", "R", "T", "H", "E", "A", "S", "T", "E", "R"],
    ["N", "B", "E", "L", "I", "E", "F", "T", "R", "E", "E", "N", "L"],
    ["T", "O", "S", "C", "O", "P", "E", "S", "I", "N", "E", "T", "Y"],
  ]
  puzzle.across_bars = [
    [null, null, null, null, true, null, null, null, null, null, null, null, null],
    [true, null, null, null, true, true, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, true, null, null, null],
    [null, null, null, null, null, null, true, true, true, null, null, null, null],
    [true, true, true, true, true, true, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, true, true, true, null, null, null, null],
    [true, true, true, null, null, null, null, null, null, true, true, true, null],
    [null, null, null, true, true, true, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, true, true, true, true, true, true, null],
    [null, null, null, true, true, true, null, null, null, null, null, null, null],
    [true, true, true, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, true, true, null, null, null, true, null],
    [null, null, null, null, null, null, null, true, null, null, null, null, null],
  ]
  puzzle.down_bars = [
    [null, null, true, null, null, null, true, null, null, true, null, null, null],
    [null, null, true, null, null, null, true, null, null, true, null, null, null],
    [null, null, true, null, null, null, true, null, null, true, null, null, null],
    [null, null, true, true, null, null, true, null, null, true, null, null, null],
    [null, null, null, null, true, null, null, null, null, true, null, true, null],
    [true, null, null, null, true, true, null, null, true, null, null, true, null],
    [null, true, null, null, true, null, null, true, true, null, null, null, true],
    [null, true, null, true, null, null, null, null, true, null, null, null, null],
    [null, true, null, true, null, null, true, null, null, true, true, null, null],
    [null, null, null, true, null, null, true, null, null, null, true, null, null],
    [null, null, null, true, null, null, true, null, null, null, true, null, null],
    [null, null, null, true, null, null, true, null, null, null, true, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
  ]
  puzzle.numbers = [
    [1, 2, "", 3, 4, 5, "", 6, 7, "", 8, 9, 10],
    ["", 11, "", "", "", "", 12, "", "", "", "", "", ""],
    [13, "", "", "", "", "", "", "", "", "", "", "", ""],
    [14, "", "", "", "", "", "", "", "", 15, "", "", ""],
    ["", "", 16, 17, "", "", 18, "", "", "", "", "", ""],
    [19, "", "", "", "", "", "", "", "", 20, "", "", ""],
    [21, "", "", "", "", 22, "", "", "", "", "", 23, ""],
    [24, "", "", "", 25, "", 26, 27, "", "", "", "", 28],
    [29, "", "", "", "", "", "", "", 30, "", "", "", ""],
    [31, 32, "", "", "", "", 33, "", "", 34, "", "", ""],
    ["", "", "", 35, "", "", "", "", "", "", "", "", ""],
    [36, "", "", "", "", "", "", "", 37, "", "", "", ""],
    [38, "", "", "", "", "", "", "", 39, "", "", "", ""],
  ]
  puzzle.circles = [
    [null, true, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, true, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, true, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, true, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
  ]
  puzzle.shade_circles = [
    [null, null, true, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, true, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, true, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, true, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
  ]
  puzzle.shade_squares = [
    [null, null, null, true, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, true, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, true, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, true, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null],
  ]
}

// auto-number a puzzle based on the bars
function autoNumberPuzzle() {
  clearNumbers();
  var locations = createArray(puzzle.rows, puzzle.cols);
  var word = "";

  // identify across entries
  for (let row=0; row<puzzle.rows; row++) {
    word = "";
    for (let col=0; col<puzzle.cols; col++) {
      // skip blanks and blocks
      if (puzzle.blanks[row][col]) { continue; }
      if (puzzle.blocks[row][col]) { continue; }
      // append to word
      if (puzzle.answers[row][col]) {
        word += puzzle.answers[row][col];
      } else {
        word += " ";
      }
      // end of answer
      if (puzzle.across_bars[row][col+1] || puzzle.blanks[row][col+1] || puzzle.blocks[row][col+1]) {
        if (word.length > 1) {
          x = col - word.length + 1;
          y = row;
          locations[y][x] = true;
          console.log("Across Word: '" + word + "' (" + word.length + " @ " + y + "-" + x + ")");
        }
        word = "";
      }
    }
    // end of row
    if (word.length > 1) {
      x = puzzle.cols - word.length;
      y = row;
      locations[y][x] = true;
      console.log("Across Word [eol]: '" + word + "' (" + word.length + " @ " + y + "-" + x + ")");
    }
    word = "";
  }

  // identify down entries
  for (let col=0; col<puzzle.cols; col++) {
    word = "";
    for (let row=0; row<puzzle.rows; row++) {
      // skip blanks and blocks
      if (puzzle.blanks[row][col]) { continue; }
      if (puzzle.blocks[row][col]) { continue; }
      // append to word
      if (puzzle.answers[row][col]) {
        word += puzzle.answers[row][col];
      } else {
        word += " ";
      }
      // end of answer
      if (
        (puzzle.down_bars[row+1] && puzzle.down_bars[row+1][col])
        || (puzzle.blanks[row+1] && puzzle.blanks[row+1][col])
        || (puzzle.blocks[row+1] && puzzle.blocks[row+1][col])
      ) {
        if (word.length > 1) {
          x = col;
          y = row - word.length + 1;
          locations[y][x] = true;
          console.log("Down Word: '" + word + "' (" + word.length + " @ " + y + "-" + x + ")");
        }
        word = "";
      }
    }
    // end of column
    if (word.length > 1) {
      x = col;
      y = puzzle.rows - word.length;
      locations[y][x] = true;
      console.log("Down Word [eol]: '" + word + "' (" + word.length + " @ " + y + "-" + x + ")");
    }
    word = "";
  }

  // number puzzle
  var num = 1;
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      if (locations[row][col]) {
        puzzle.numbers[row][col] = num;
        num += 1;
      }
    }
  }

  createGrid();
}

// select input on focus
function blurInput(input) {
  var id = input.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  if (input.id.startsWith("answer")) {
    console.log("Blur Answer Input: " + input.id);
    if (puzzle.answers[row][col]) {
      input.value = puzzle.answers[row][col];
    }  else {
      input.value = "";
    }
  } else {
    console.log("Blur Number Input: " + input.id);
    if (puzzle.numbers[row][col]) {
      input.value = puzzle.numbers[row][col];
    }  else {
      input.value = "";
    }
  }
  // document.getElementById("grid-answer-rebus-button").classList.add("hidden");
}

// clear all answers
function clearAnswers() {
  puzzle.answers = createArray(puzzle.rows, puzzle.cols);
  createGrid();
}

// clear all bars
function clearBars() {
  puzzle.across_bars = createArray(puzzle.rows, puzzle.cols);
  puzzle.down_bars = createArray(puzzle.rows, puzzle.cols);
  createGrid();
}

// clear all blanks
function clearBlanks() {
  puzzle.blanks = createArray(puzzle.rows, puzzle.cols);
  createGrid();
}

// clear all blocks
function clearBlocks() {
  puzzle.blocks = createArray(puzzle.rows, puzzle.cols);
  createGrid();
}

// clear all circles
function clearCircles() {
  puzzle.circles = createArray(puzzle.rows, puzzle.cols);
  createGrid();
}

// clear all numbers
function clearNumbers() {
  puzzle.numbers = createArray(puzzle.rows, puzzle.cols);
  createGrid();
}

// clear all shade circles
function clearShadeCircles() {
  puzzle.shade_circles = createArray(puzzle.rows, puzzle.cols);
  createGrid();
}

// clear all shade squares
function clearShadeSquares() {
  puzzle.shade_squares = createArray(puzzle.rows, puzzle.cols);
  createGrid();
}


// create a multi-dimensional array of rows x cols
function createArray(rows, cols) {
  return Array.from(Array(rows), () => new Array(cols));
}

// create an SVG to represent Bar Joins
function createBarJoinsSVG() {
  // create svg element
  var svg = document.createElementNS(svgns, "svg");
  svg.id = "bar-joins-button";
  svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
  svg.setAttribute("height", 100);
  svg.setAttribute("width", 100);
  svg.setAttribute("fill", "white");
  svg.setAttribute("style", "border: 1px solid grey");
  svg.classList.add("bar-joins-button")
  svg.addEventListener("click", (event) => {toggleBarJoinCaps(event)});

  // create text group
  var textgroup = document.createElementNS(svgns, "g");
  textgroup.setAttribute("fill", "black");
  textgroup.setAttribute("font-family", "helvetica");
  textgroup.setAttribute("font-weight", "bold");
  textgroup.setAttribute("font-size", "14px");
  textgroup.setAttribute("text-anchor", "middle");

  // add header
  var header = document.createElementNS(svgns, "text");
  header.setAttribute("x", 50);
  header.setAttribute("y", 17);
  header.innerHTML = "Bar Joins";
  textgroup.appendChild(header);

  // add footer
  var footer = document.createElementNS(svgns, "text");
  footer.setAttribute("x", 50);
  footer.setAttribute("y", 93);
  if (puzzle.bar_join_caps) {
    footer.innerHTML = "Caps";
  } else {
    footer.innerHTML = "No Caps";
  }
  textgroup.appendChild(footer);

  // add horizontal grid line
  var hline = document.createElementNS(svgns, "line");
  hline.setAttribute("x1", 30);
  hline.setAttribute("x2", 50);
  hline.setAttribute("y1", 50);
  hline.setAttribute("y2", 50);
  hline.setAttribute("stroke", "black");
  hline.setAttribute("stroke-width", "1px");
  svg.appendChild(hline);

  // add verticial grid line
  var vline = document.createElementNS(svgns, "line");
  vline.setAttribute("x1", 50);
  vline.setAttribute("x2", 50);
  vline.setAttribute("y1", 30);
  vline.setAttribute("y2", 50);
  vline.setAttribute("stroke", "black");
  vline.setAttribute("stroke-width", "1px");
  svg.appendChild(vline);

  // add hoizontal bar line
  var hbar = document.createElementNS(svgns, "line");
  hbar.setAttribute("x1", 50);
  hbar.setAttribute("x2", 70);
  hbar.setAttribute("y1", 50);
  hbar.setAttribute("y2", 50);
  hbar.setAttribute("stroke", "black");
  hbar.setAttribute("stroke-width", "8px");
  svg.appendChild(hbar);

  // add verticial bar line
  var vbar = document.createElementNS(svgns, "line");
  vbar.setAttribute("x1", 50);
  vbar.setAttribute("x2", 50);
  vbar.setAttribute("y1", 50);
  vbar.setAttribute("y2", 70);
  vbar.setAttribute("stroke", "black");
  vbar.setAttribute("stroke-width", "8px");
  svg.appendChild(vbar);

  var border = document.createElementNS(svgns, "rect");
  border.setAttribute("x", 25);
  border.setAttribute("y", 25);
  border.setAttribute("fill", "transparent");
  border.setAttribute("stroke", "black");
  border.setAttribute("stroke-width", "1px");
  border.setAttribute("height", "50px");
  border.setAttribute("width", "50px");
  svg.appendChild(border)

  // add cap
  if (puzzle.bar_join_caps) {
    var cap = document.createElementNS(svgns, "rect");
    cap.setAttribute("x", 46);
    cap.setAttribute("y", 46);
    cap.setAttribute("fill", "black");
    cap.setAttribute("height", "8px");
    cap.setAttribute("width", "8px");
    svg.appendChild(cap)
  }

  svg.appendChild(textgroup);

  // create the new bar joins SVG and replace existing button
  var button = document.getElementById("bar-joins-button");
  button.parentNode.replaceChild(svg, button);
}

// create the grid and all its layers and set the title
function createGrid() {
  // set the document title and title element
  document.title = puzzle.title;
  document.getElementById("title").value = puzzle.title;

  createGridSVG();

  // create the interactive layers
  createAnswers();
  createBars();
  createNumbers();
  createShadeSquares();
  createShadeCircles();
  createCircles();
  createBlocks();
  createBlanks();

  // create the bar joins button svg
  createBarJoinsSVG();

  // toggle symmetry controls
  if (puzzle.cols == puzzle.rows) {
    document.getElementById("symmetry-mirror-d").disabled = false;
    document.getElementById("symmetry-mirror-u").disabled = false;
    document.getElementById("symmetry-mirror-4d").disabled = false;
    document.getElementById("symmetry-mirror-8").disabled = false;
  } else {
    document.getElementById("symmetry-mirror-d").disabled = true;
    document.getElementById("symmetry-mirror-u").disabled = true;
    document.getElementById("symmetry-mirror-4d").disabled = true;
    document.getElementById("symmetry-mirror-8").disabled = true;
  }

  showAllLayers();
}

// create/update the SVG in the grid
function createGridSVG() {
  // create the new grid SVG and replace existing grid
  var grid = document.getElementById("grid");
  var svg = createSVG();
  grid.parentNode.replaceChild(svg, grid);
}

// create answers interface layer
function createAnswers() {
  var answers = document.getElementById("grid-answers-layer");
  removeChildren(answers);
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      answer = document.createElement("input");
      answer.id = "answer-" + row + "-" + col;
      if (puzzle.answers[row][col]) {
        answer.value = puzzle.answers[row][col];
      }
      answer.addEventListener("blur", (event) => {blurInput(event.target)});
      answer.addEventListener("change", (event) => {updateAnswer(event.target)});
      answer.addEventListener("focus", (event) => {focusInput(event.target)});
      answer.addEventListener("keyup", (event) => {nextInput(event)});
      answer.classList.add("grid__answer__input");
      answer.style["left"] = (50 * col + 2) + "px";
      answer.style["top"] = (50 * row + 2) + "px";
      // answer.style["height"] = puzzle.size + "px";
      // answer.style["width"] = puzzle.size + "px";
      answer.type = "text"
      answer.maxLength = "1"
      answers.append(answer);
    }
  }
}

// create bars interface layer
function createBars() {
  var bars = document.getElementById("grid-bars-layer");
  removeChildren(bars);
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 1; col < puzzle.cols; col++) {
      acrossbar = document.createElement("div");
      acrossbar.id = "acrossbar-" + row + "-" + col;
      acrossbar.classList.add("grid__bar");
      acrossbar.addEventListener("click", (event) => {updateAcrossBars(event.target);});
      acrossbar.style["left"] = (50 * col - 5) + "px";
      acrossbar.style["top"] = (50 * row) + "px";
      acrossbar.style["height"] = "50px";
      acrossbar.style["width"] = "10px";
      bars.append(acrossbar);
    }
  }
  for (let col = 0; col < puzzle.cols; col++) {
    for (let row = 1; row < puzzle.rows; row++) {
      downbar = document.createElement("div");
      downbar.id = "downbar-" + row + "-" + col;
      downbar.classList.add("grid__bar");
      downbar.addEventListener("click", (event) => {updateDownBars(event.target);});
      downbar.style["left"] = (50 * col) + "px";
      downbar.style["top"] = (50 * row - 5) + "px";
      downbar.style["height"] = "10px";
      downbar.style["width"] = "50px";
      bars.append(downbar);
    }
  }
}

// create blanks interface layer
function createBlanks() {
  var blanks = document.getElementById("grid-blanks-layer");
  removeChildren(blanks);
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      blank = document.createElement("div");
      blank.id = "blank-" + row + "-" + col;
      blank.addEventListener("click", (event) => {updateBlank(event.target);});
      blank.classList.add("grid__blank");
      blank.style["left"] = (50 * col + 2) + "px";
      blank.style["top"] = (50 * row + 2) + "px";
      blank.style["height"] = "46px";
      blank.style["width"] = "46px";
      blanks.append(blank);
    }
  }
}

// create blocks interface layer
function createBlocks() {
  var blocks = document.getElementById("grid-blocks-layer");
  removeChildren(blocks);
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      block = document.createElement("div");
      block.id = "block-" + row + "-" + col;
      block.addEventListener("click", (event) => {updateBlock(event.target);});
      block.classList.add("grid__block");
      block.style["left"] = (50 * col + 2) + "px";
      block.style["top"] = (50 * row + 2) + "px";
      block.style["height"] = "46px";
      block.style["width"] = "46px";
      blocks.append(block);
    }
  }
}

// create circles interface layer
function createCircles() {
  var circles = document.getElementById("grid-circles-layer");
  removeChildren(circles);
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      circle = document.createElement("div");
      circle.id = "circle-" + row + "-" + col;
      circle.addEventListener("click", (event) => {updateCircle(event.target);});
      circle.classList.add("grid__circle");
      circle.style["left"] = (50 * col + 2) + "px";
      circle.style["top"] = (50 * row + 2) + "px";
      circle.style["height"] = "46px";
      circle.style["width"] = "46px";
      circles.append(circle);
    }
  }
}

// create numbers interface layer
function createNumbers() {
  var numbers = document.getElementById("grid-numbers-layer");
  removeChildren(numbers);
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      number = document.createElement("input");
      number.id = "number-" + row + "-" + col;
      if (puzzle.numbers[row][col]) {
        number.value = puzzle.numbers[row][col];
      }
      number.addEventListener("blur", (event) => {blurInput(event.target)});
      number.addEventListener("change", (event) => {updateNumber(event.target)});
      number.addEventListener("focus", (event) => {focusInput(event.target)});
      number.addEventListener("keyup", (event) => {nextInput(event)});
      number.classList.add("grid__number__input");
      number.style["left"] = (50 * col + 2) + "px";
      number.style["top"] = (50 * row + 2) + "px";
      number.style["height"] = "16px";
      number.style["width"] = "20px";
      number.type = "text";
      number.maxLength = "2";
      numbers.append(number);
    }
  }
}

// create shade circle interface layer
function createShadeCircles() {
  var shade_circles = document.getElementById("grid-shadecircles-layer");
  removeChildren(shade_circles);
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      shade_circle = document.createElement("div");
      shade_circle.id = "shadecircle-" + row + "-" + col;
      shade_circle.addEventListener("click", (event) => {updateShadeCircle(event.target);});
      shade_circle.classList.add("grid__shadecircle");
      shade_circle.style["left"] = (50 * col + 2) + "px";
      shade_circle.style["top"] = (50 * row + 2) + "px";
      shade_circle.style["height"] = "46px";
      shade_circle.style["width"] = "46px";
      shade_circles.append(shade_circle);
    }
  }
}

// create shade squares interface layer
function createShadeSquares() {
  var shade_squares = document.getElementById("grid-shadesquares-layer");
  removeChildren(shade_squares);
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      shade_square = document.createElement("div");
      shade_square.id = "shadesquare-" + row + "-" + col;
      shade_square.addEventListener("click", (event) => {updateShadeSquare(event.target);});
      shade_square.classList.add("grid__shadesquare");
      shade_square.style["left"] = (50 * col + 2) + "px";
      shade_square.style["top"] = (50 * row + 2) + "px";
      shade_square.style["height"] = "46px";
      shade_square.style["width"] = "46px";
      shade_squares.append(shade_square);
    }
  }
}

// create the SVG image of the grid
function createSVG() {
  var svg = createSVGElement();
  createSVGSquares(svg);
  createSVGBlocks(svg);
  createSVGShadeSquares(svg);
  createSVGShadeCircles(svg);
  createSVGCircles(svg);
  createSVGAcrossBars(svg);
  createSVGDownBars(svg);
  if (puzzle.bar_join_caps) {
    createSVGBarJoinCaps(svg);
  }
  createSVGNumbers(svg);
  createSVGAnswers(svg);
  createSVGBorder(svg);
  return svg;
}

// create the answers for the SVG
function createSVGAnswers(svg) {
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-answers";
  group.setAttribute("fill", "black");
  group.setAttribute("font-family", puzzle.answer_font_family);
  group.setAttribute("font-size", "24px");
  group.setAttribute("text-anchor", "middle");

  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      if (puzzle.answers[row][col]) {
        let text = document.createElementNS(svgns, "text");
        text.id = "svg-answer-" + row + "-" + col;
        text.setAttribute("data-col", col);
        text.setAttribute("data-row", row);
        text.setAttribute("x", col * puzzle.size + puzzle.size/2 + 4);
        text.setAttribute("y", row * puzzle.size + puzzle.size/2 + 4);
        // not currently inherited in all browsers
        text.setAttribute("dominant-baseline", "central");
        text.innerHTML = puzzle.answers[row][col];
        if (text.innerHTML.length > 4) {
          text.setAttribute("font-size", "10px");
        } else if (text.innerHTML.length > 3) {
          text.setAttribute("font-size", "12px");
        } else if (text.innerHTML.length > 2) {
          text.setAttribute("font-size", "16px");
        } else if (text.innerHTML.length > 1) {
          text.setAttribute("font-size", "20px");
        }

        group.appendChild(text);
      }
    }
  }
  svg.appendChild(group);
}

// create the bar join caps for the SVG
function createSVGBarJoinCaps(svg) {
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-barjoincaps";
  for (let row = 1; row < puzzle.rows; row++) {
    for (let col = 1; col < puzzle.cols; col++) {
      if (
          (puzzle.across_bars[row-1][col] || puzzle.across_bars[row][col])
          &&
          (puzzle.down_bars[row][col-1] || puzzle.down_bars[row][col])
        ) {
        let rect = document.createElementNS(svgns, "use");
        rect.id = "svg-barjoincap-" + row + "-" + col;
        rect.setAttributeNS(xlinkns, "href", "#svg-barjoincap");
        rect.setAttribute("data-col", col);
        rect.setAttribute("data-row", row);
        rect.setAttribute("x", col * puzzle.size + 2);
        rect.setAttribute("y", row * puzzle.size + 2);
        group.appendChild(rect);
      }
    }
  }
  svg.appendChild(group);
}

// create the bars for the svg
function createSVGAcrossBars(svg) {
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-acrossbars";
  group.setAttribute("stroke", "black");
  group.setAttribute("stroke-width", "4px");
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 1; col < puzzle.cols; col++) {
      if (puzzle.across_bars[row][col]) {
        let line = document.createElementNS(svgns, "line");
        line.id = "svg-acrossbar-" + row + "-" + col;
        line.setAttribute("data-col", col);
        line.setAttribute("data-row", row);
        line.setAttribute("x1", col * puzzle.size + 4);
        line.setAttribute("y1", row * puzzle.size + 4);
        line.setAttribute("x2", col * puzzle.size + 4);
        line.setAttribute("y2", row * puzzle.size + puzzle.size + 4);
        group.appendChild(line);
      }
    }
  }
  svg.appendChild(group);
}

function createSVGDownBars(svg) {
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-downbars";
  group.setAttribute("stroke", "black");
  group.setAttribute("stroke-width", "4px");
  for (let col = 0; col < puzzle.cols; col++) {
    for (let row = 0; row < puzzle.rows; row++) {
      if (puzzle.down_bars[row][col]) {
        let line = document.createElementNS(svgns, "line");
        line.id = "svg-downbar-" + row + "-" + col;
        line.setAttribute("data-col", col);
        line.setAttribute("data-row", row);
        line.setAttribute("x1", col * puzzle.size + 4);
        line.setAttribute("y1", row * puzzle.size + 4);
        line.setAttribute("x2", col * puzzle.size + puzzle.size + 4);
        line.setAttribute("y2", row * puzzle.size + 4);
        group.appendChild(line);
      }
    }
  }
  svg.appendChild(group);
}

// create the blocks for the SVG
function createSVGBlocks(svg) {
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-blocks";
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      if (puzzle.blocks[row][col]) {
        let rect = document.createElementNS(svgns, "use");
        rect.id = "svg-block-" + row + "-" + col;
        rect.setAttributeNS(xlinkns, "href", "#svg-shadesquare");
        rect.setAttribute("data-col", col);
        rect.setAttribute("data-row", row);
        rect.setAttribute("x", col * puzzle.size + 4);
        rect.setAttribute("y", row * puzzle.size + 4);
        rect.setAttribute("fill", "#000000");
        group.appendChild(rect);
      }
    }
  }
  svg.appendChild(group);
}

// create the border for the svg
function createSVGBorder(svg) {
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-border";
  group.setAttribute("stroke", "black");
  group.setAttribute("stroke-width", "4px");
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      if (puzzle.blanks[row][col]) { continue; }

      // across borders
      // if the left square is blank or null, create a left border line
      if (col - 1 < 0 || puzzle.blanks[row][col - 1]) {
        let line = document.createElementNS(svgns, "line");
        line.id = "svg-acrossborder-" + row + "-" + col;
        line.setAttribute("data-col", col);
        line.setAttribute("data-row", row);
        line.setAttribute("x1", col * puzzle.size + 4);
        line.setAttribute("y1", row * puzzle.size + 2);
        line.setAttribute("x2", col * puzzle.size + 4);
        line.setAttribute("y2", row * puzzle.size + puzzle.size + 6);
        group.appendChild(line);
      }

      // if the right square is blank or null, create a right border line
      if (col + 1 >= puzzle.cols || puzzle.blanks[row][col + 1]) {
        let line = document.createElementNS(svgns, "line");
        line.id = "svg-acrossborder-" + row + "-" + col;
        line.setAttribute("data-col", col);
        line.setAttribute("data-row", row);
        line.setAttribute("x1", (col + 1) * puzzle.size + 4);
        line.setAttribute("y1", row * puzzle.size + 2);
        line.setAttribute("x2", (col + 1) * puzzle.size + 4);
        line.setAttribute("y2", row * puzzle.size + puzzle.size + 6);
        group.appendChild(line);
      }

      // down borders
      // if the top square is blank or null, create a top border line
      if (row - 1 < 0 || puzzle.blanks[row - 1][col]) {
        let line = document.createElementNS(svgns, "line");
        line.id = "svg-downborder-" + row + "-" + col;
        line.setAttribute("data-col", col);
        line.setAttribute("data-row", row);
        line.setAttribute("x1", col * puzzle.size + 2);
        line.setAttribute("y1", row * puzzle.size + 4);
        line.setAttribute("x2", col * puzzle.size + puzzle.size + 6);
        line.setAttribute("y2", row * puzzle.size + 4);
        group.appendChild(line);
      }

      // if the bottom square is blank or null, create a bottom border line
      if (row + 1 >= puzzle.rows || puzzle.blanks[row + 1][col]) {
        let line = document.createElementNS(svgns, "line");
        line.id = "svg-downborder-" + row + "-" + col;
        line.setAttribute("data-col", col);
        line.setAttribute("data-row", row);
        line.setAttribute("x1", col * puzzle.size + 2);
        line.setAttribute("y1", (row + 1) * puzzle.size + 4);
        line.setAttribute("x2", col * puzzle.size + puzzle.size + 6);
        line.setAttribute("y2", (row + 1) * puzzle.size + 4);
        group.appendChild(line);
      }

    }
  }
  svg.appendChild(group);
}

// create the circles for the SVG
function createSVGCircles(svg) {
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-circles";
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      if (puzzle.circles[row][col]) {
        let circle = document.createElementNS(svgns, "use");
        circle.id = "svg-circle-" + col + "-" + row;
        circle.setAttributeNS(xlinkns, "href", "#svg-circle");
        circle.setAttribute("data-col", col);
        circle.setAttribute("data-row", row);
        circle.setAttribute("x", col * puzzle.size + puzzle.size/2 + 4);
        circle.setAttribute("y", row * puzzle.size + puzzle.size/2 + 4);
        group.appendChild(circle);
      }
    }
  }
  svg.appendChild(group);
}

// create the basic SVG element that contains the other elements
function createSVGElement() {
  var svg = document.createElementNS(svgns, "svg");
  svg.id = "grid";

  svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);

  // set data attributes with puzzle info
  svg.setAttribute("data-title", puzzle.title);
  svg.setAttribute("data-rows", puzzle.rows);
  svg.setAttribute("data-cols", puzzle.cols);
  svg.setAttribute("data-size", puzzle.size);
  svg.setAttribute("data-creator", "BarGrids");

  // set visual attributes
  svg.setAttribute("height", puzzle.rows * puzzle.size + 8);
  svg.setAttribute("width", puzzle.cols * puzzle.size + 8);
  svg.setAttribute("fill", "white");
  // svg.setAttribute("style", "border: 4px solid black");

  // set the title
  var title = document.createElementNS(svgns, "title");
  title.innerHTML = puzzle.title;
  svg.appendChild(title);

  // set the description
  var desc = document.createElementNS(svgns, "desc");
  desc.innerHTML = "Created by BarGrids - https://github.com/lukwam/bargrids";
  svg.appendChild(desc);

  // create defs of re-usable objects
  defineGridObjects(svg);

  return svg;
}

// create the numbers for the SVG
function createSVGNumbers(svg) {
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-numbers";
  group.setAttribute("fill", "black");
  group.setAttribute("font-family", puzzle.number_font_family);
  group.setAttribute("font-size", "14px");

  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      if (puzzle.numbers[row][col]) {
        let text = document.createElementNS(svgns, "text");
        text.id = "svg-number-" + row + "-" + col;
        text.setAttribute("data-col", col);
        text.setAttribute("data-row", row);
        text.setAttribute("x", col * puzzle.size + 8);
        text.setAttribute("y", row * puzzle.size + 19);
        text.innerHTML = puzzle.numbers[row][col];
        group.appendChild(text);
      }
    }
  }
  svg.appendChild(group);
}

function createSVGSource(svg) {
  // get svg source.
  var serializer = new XMLSerializer();
  var source = serializer.serializeToString(svg);

  // update name spaces.
  if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // add xml declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  return source;
}

function createXMLSource(xml) {
  var ccns = "http://crossword.info/xml/crossword-compiler";
  var rpns = "http://crossword.info/xml/rectangular-puzzle";
  var xml = document.createElementNS(ccns, "crossword-compiler");

  var puz = document.createElementNS(rpns, "rectangular-puzzle")
  var metadata = document.createElementNS(rpns, "metadata");

  // set title
  var title = document.createElementNS(rpns, "title");
  title.innerHTML = puzzle.title;

  metadata.appendChild(title);
  puz.appendChild(metadata);

  var crossword = document.createElementNS(rpns, "crossword");
  var grid = document.createElementNS(rpns, "grid");
  grid.setAttribute("height", puzzle.rows);
  grid.setAttribute("width", puzzle.cols);

  var gridlook = document.createElementNS(rpns, "grid-look");
  gridlook.setAttribute("numbering-scheme", "normal");
  gridlook.setAttribute("cell-size-in-pixels", "26");
  gridlook.setAttribute("clue-square-divider-width", "0.7");

  grid.appendChild(gridlook);

  // create cells
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      let cell = document.createElementNS(rpns, "cell");
      cell.setAttribute("x", col + 1);
      cell.setAttribute("y", row + 1);

      if (puzzle.blanks[row][col]) {
        cell.setAttribute("type", "void");
        continue;
      }

      if (puzzle.blocks[row][col]) {
        cell.setAttribute("type", "block");
        continue;
      }

      if (puzzle.answers[row][col]) {
        cell.setAttribute("solution", puzzle.answers[row][col]);
      }

      if (puzzle.numbers[row][col]) {
        cell.setAttribute("number", puzzle.numbers[row][col]);
      }

      if (puzzle.across_bars[row][col]) {
        cell.setAttribute("left-bar", true);
      }

      if (puzzle.down_bars[row][col]) {
        cell.setAttribute("top-bar", true);
      }

      if (puzzle.circles[row][col]) {
        cell.setAttribute("background-shape", "circle");
      }

      if (puzzle.shade_squares[row][col]) {
        cell.setAttribute("background-color", getShade(puzzle.shade_squares[row][col]));
      }

      // text.id = "svg-number-" + row + "-" + col;
      // text.setAttribute("data-col", col);
      // text.setAttribute("data-row", row);
      // text.setAttribute("x", col * puzzle.size + 8);
      // text.setAttribute("y", row * puzzle.size + 19);
      // text.innerHTML = puzzle.numbers[row][col];
      grid.appendChild(cell);
    }
  }

  crossword.appendChild(grid);
  puz.appendChild(crossword);
  xml.appendChild(puz);
  console.log(xml);

  // get xml source.
  var serializer = new XMLSerializer();
  var source = serializer.serializeToString(xml);

  // update name spaces.
  // if(!source.match(/^<crossword-compiler[^>]+xmlns="http\:\/\/crossword\.info\/xml\/crossword-compiler"/)){
  //     source = source.replace(/^<crossword-compiler/, '<crossword-compiler xmlns="http://crossword.info/xml/crossword-compiler"');
  // }
  // if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
  //     source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  // }

  // add xml declaration
  // source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  console.log(source);
  return source;
}

// create the basic squares for the SVG
function createSVGSquares(svg) {
  var blanksgroup = document.createElementNS(svgns, "g");
  blanksgroup.id = "svg-blanks";
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-squares";

  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      if (puzzle.blanks[row][col]) {
        let rect = document.createElementNS(svgns, "use");
        rect.id = "svg-blank-" + row + "-" + col;
        rect.setAttribute("data-col", col);
        rect.setAttribute("data-row", row);
        rect.setAttribute("x", col * puzzle.size + 4);
        rect.setAttribute("y", row * puzzle.size + 4);
        rect.setAttribute("stroke", "transparent");
        blanksgroup.appendChild(rect);
      } else {
        let rect = document.createElementNS(svgns, "use");
        rect.id = "svg-square-" + row + "-" + col;
        rect.setAttributeNS(xlinkns, "href", "#svg-square");
        rect.setAttribute("data-col", col);
        rect.setAttribute("data-row", row);
        rect.setAttribute("x", col * puzzle.size + 4);
        rect.setAttribute("y", row * puzzle.size + 4);
        group.appendChild(rect);
      }
    }
  }
  svg.appendChild(blanksgroup);
  svg.appendChild(group);
}

// create the shade cirlces for the SVG
function createSVGShadeCircles(svg) {
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-shadecircles";
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      if (puzzle.shade_circles[row][col]) {
        var shade = getShade(puzzle.shade_circles[row][col]);
        let circle = document.createElementNS(svgns, "use");
        circle.id = "svg-shadecircle-" + row + "-" + col;
        circle.setAttributeNS(xlinkns, "href", "#svg-shadecircle");
        circle.setAttribute("data-col", col);
        circle.setAttribute("data-row", row);
        circle.setAttribute("data-value", puzzle.shade_circles[row][col]);
        circle.setAttribute("x", col * puzzle.size + puzzle.size/2 + 4);
        circle.setAttribute("y", row * puzzle.size + puzzle.size/2 + 4);
        circle.setAttribute("fill", shade);
        group.appendChild(circle);
      }
    }
  }
  svg.appendChild(group);
}

// create the shade squares for the SVG
function createSVGShadeSquares(svg) {
  var group = document.createElementNS(svgns, "g");
  group.id = "svg-shadesquares";
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      if (puzzle.shade_squares[row][col]) {
        var shade = getShade(puzzle.shade_squares[row][col]);
        let rect = document.createElementNS(svgns, "use");
        rect.id = "svg-shadesquare-" + row + "-" + col;
        rect.setAttributeNS(xlinkns, "href", "#svg-shadesquare");
        rect.setAttribute("data-col", col);
        rect.setAttribute("data-row", row);
        rect.setAttribute("data-value", puzzle.shade_squares[row][col]);
        rect.setAttribute("x", col * puzzle.size + 4);
        rect.setAttribute("y", row * puzzle.size + 4);
        rect.setAttribute("fill", shade);
        group.appendChild(rect);
      }
    }
  }
  svg.appendChild(group);
}

// define an individual grid answer for the SVG
// function defineGridAnswer(defs) {
//   let text = document.createElementNS(svgns, "text");
//   text.id = "svg-answer";
//   text.setAttribute("dominant-baseline", "central");
//   text.setAttribute("fill", "black");
//   text.setAttribute("font-family", "helvetica");
//   text.setAttribute("font-size", "24px");
//   text.setAttribute("text-anchor", "middle");
//   text.setAttribute("x", 0);
//   text.setAttribute("y", 0);
//   defs.appendChild(text);
// }

// define an individual grid bar for the svg
// function defineGridBar(defs) {
//   let line = document.createElementNS(svgns, "line");
//   line.id = "svg-bar";
//   line.setAttribute("stroke", "black");
//   line.setAttribute("stroke-width", "4px");
//   line.setAttribute("x", 0);
//   line.setAttribute("y", 0);
//   defs.appendChild(line);
// }

// define an individual grid bar join cap for the svg
function defineGridBarJoinCap(defs) {
  let rect = document.createElementNS(svgns, "rect");
  rect.id = "svg-barjoincap";
  rect.setAttribute("fill", "black");
  rect.setAttribute("height", 4);
  rect.setAttribute("width", 4);
  rect.setAttribute("x", 0);
  rect.setAttribute("y", 0);
  defs.appendChild(rect);
}

// define an individual grid circle for the SVG
function defineGridCircle(defs) {
  let circle = document.createElementNS(svgns, "circle");
  circle.id = "svg-circle";
  circle.setAttribute("r", puzzle.size/2 - 3);
  circle.setAttribute("fill", "transparent");
  circle.setAttribute("stroke", "black");
  circle.setAttribute("stroke-width", "1px");
  defs.appendChild(circle);
}

// define an individual grid number for the SVG
// function defineGridNumber(defs) {
//   let text = document.createElementNS(svgns, "text");
//   text.id = "svg-number";
//   text.setAttribute("fill", "black");
//   text.setAttribute("font-family", "helvetica");
//   text.setAttribute("font-size", "14px");
//   text.setAttribute("x", 0);
//   text.setAttribute("y", 0);
//   defs.appendChild(text);
// }

// define a set of objects for the grid SVG
function defineGridObjects(svg) {
  var defs = document.createElementNS(svgns, "defs");

  // circle elements
  defineGridCircle(defs);
  defineGridShadeCircle(defs);

  // line elements
  // defineGridBar(defs);

  // rectangle elements
  defineGridBarJoinCap(defs);
  defineGridShadeSquare(defs);
  defineGridSquare(defs);

  // text elements
  // defineGridAnswer(defs);
  // defineGridNumber(defs);

  svg.appendChild(defs);
}

// define an individual grid square for the SVG
function defineGridSquare(defs) {
  let rect = document.createElementNS(svgns, "rect");
  rect.id = "svg-square";
  rect.setAttribute("fill", "white");
  rect.setAttribute("height", puzzle.size);
  rect.setAttribute("width", puzzle.size);
  rect.setAttribute("stroke", "black");
  rect.setAttribute("stroke-width", "1px");
  defs.appendChild(rect);
}

  // define an individual grid shade circle for the SVG
  function defineGridShadeCircle(defs) {
  let circle = document.createElementNS(svgns, "circle");
  circle.id = "svg-shadecircle";
  circle.setAttribute("r", puzzle.size/2 - 3);
  defs.appendChild(circle);
}

// define an individual grid shade square for the SVG
function defineGridShadeSquare(defs) {
  let rect = document.createElementNS(svgns, "rect");
  rect.id = "svg-shadesquare";
  rect.setAttribute("height", puzzle.size);
  rect.setAttribute("width", puzzle.size);
  rect.setAttribute("stroke", "black");
  rect.setAttribute("stroke-width", "1px");
  defs.appendChild(rect);
}

// disable a tool and layer by div
function disableTool(div) {
  if (div.id == "answer-tool") {
    disableAnswerTool(div);
  } else if (div.id == "bar-tool") {
    disableBarTool(div);
  } else if (div.id == "number-tool") {
    disableNumberTool(div);
  } else if (div.id == "shade-square-tool") {
    disableShadeSquareTool(div);
  } else if (div.id == "shade-circle-tool") {
    disableShadeCircleTool(div);
  } else if (div.id == "circle-tool") {
    disableCircleTool(div);
  } else if (div.id == "block-tool") {
    disableBlockTool(div);
  } else if (div.id == "blank-tool") {
    disableBlankTool(div);
  }
}

// disable the answers toolbar item and layer
function disableAnswerTool(div) {
  console.log("Disabling Answer Tool");
  div.classList.remove("grid__toolbar__item--selected");
  document.getElementById("grid-answers-layer").classList.add("hidden");
  document.getElementById("grid-answer-settings").classList.add("hidden");
}

// disable the bars toolbar item and layer
function disableBarTool(div) {
  console.log("Disabling Bar Tool");
  div.classList.remove("grid__toolbar__item--selected");
  document.getElementById("grid-bars-layer").classList.add("hidden");
  document.getElementById("grid-bar-settings").classList.add("hidden");
}

// disable the blank toolbar item and layer
function disableBlankTool(div) {
  console.log("Disabling Blank Tool");
  div.classList.remove("grid__toolbar__item--selected");
  document.getElementById("grid-blanks-layer").classList.add("hidden");
  document.getElementById("grid-blank-settings").classList.add("hidden");
}

// disable the block toolbar item and layer
function disableBlockTool(div) {
  console.log("Disabling Block Tool");
  div.classList.remove("grid__toolbar__item--selected");
  document.getElementById("grid-blocks-layer").classList.add("hidden");
  document.getElementById("grid-block-settings").classList.add("hidden");
}
// disable the circles toolbar item and layer
function disableCircleTool(div) {
  console.log("Disabling Circle Tool");
  div.classList.remove("grid__toolbar__item--selected");
  document.getElementById("grid-circles-layer").classList.add("hidden");
  document.getElementById("grid-circle-settings").classList.add("hidden");
}

// disable the numbers toolbar item and layer
function disableNumberTool(div) {
  console.log("Disabling Number Tool");
  div.classList.remove("grid__toolbar__item--selected");
  document.getElementById("grid-numbers-layer").classList.add("hidden");
  document.getElementById("grid-number-settings").classList.add("hidden");
}

// disable the shade squares toolbar item and layer
function disableShadeSquareTool(div) {
  console.log("Disabling Shade Square Tool");
  div.classList.remove("grid__toolbar__item--selected");
  document.getElementById("grid-shadesquares-layer").classList.add("hidden");
  document.getElementById("grid-shadesquare-settings").classList.add("hidden");
}

// disable the shade circles toolbar item and layer
function disableShadeCircleTool(div) {
  console.log("Disabling Shade Circle Tool");
  div.classList.remove("grid__toolbar__item--selected");
  document.getElementById("grid-shadecircles-layer").classList.add("hidden");
  document.getElementById("grid-shadecircle-settings").classList.add("hidden");
}

// enable a tool based on the div
function enableTool(div) {
  if (div.id == "answer-tool") {
    enableAnswerTool(div);
  } else if (div.id == "bar-tool") {
    enableBarTool(div);
  } else if (div.id == "number-tool") {
    enableNumberTool(div);
  } else if (div.id == "shade-square-tool") {
    enableShadeSquareTool(div);
  } else if (div.id == "shade-circle-tool") {
    enableShadeCircleTool(div);
  } else if (div.id == "circle-tool") {
    enableCircleTool(div);
  } else if (div.id == "block-tool") {
    enableBlockTool(div);
  } else if (div.id == "blank-tool") {
    enableBlankTool(div);
  }
}

// enable the answer tool and layer
function enableAnswerTool(div) {
  console.log("Enabling Answer Tool");
  div.classList.add("grid__toolbar__item--selected");
  document.getElementById("grid-answers-layer").classList.remove("hidden");
  document.getElementById("grid-toolbar-item-name").innerHTML = "Answers";
  document.getElementById("grid-answer-settings").classList.remove("hidden");
}

// enable the bar tool and layer
function enableBarTool(div) {
  console.log("Enabling Bar Tool");
  div.classList.add("grid__toolbar__item--selected");
  document.getElementById("grid-bars-layer").classList.remove("hidden");
  document.getElementById("grid-toolbar-item-name").innerHTML = "Bars";
  document.getElementById("grid-bar-settings").classList.remove("hidden");
}

// enable the blank tool and layer
function enableBlankTool(div) {
  console.log("Enabling Blank Tool");
  div.classList.add("grid__toolbar__item--selected");
  document.getElementById("grid-blanks-layer").classList.remove("hidden");
  document.getElementById("grid-toolbar-item-name").innerHTML = "Blanks";
  document.getElementById("grid-blank-settings").classList.remove("hidden");
}

// enable the block tool and layer
function enableBlockTool(div) {
  console.log("Enabling Block Tool");
  div.classList.add("grid__toolbar__item--selected");
  document.getElementById("grid-blocks-layer").classList.remove("hidden");
  document.getElementById("grid-toolbar-item-name").innerHTML = "Blocks";
  document.getElementById("grid-block-settings").classList.remove("hidden");
}

// enable the circles tool and layer
function enableCircleTool(div) {
  console.log("Enabling Circle Tool");
  div.classList.add("grid__toolbar__item--selected");
  document.getElementById("grid-circles-layer").classList.remove("hidden");
  document.getElementById("grid-toolbar-item-name").innerHTML = "Circles";
  document.getElementById("grid-circle-settings").classList.remove("hidden");
}

// enable the number tool and layer
function enableNumberTool(div) {
  console.log("Enabling Number Tool");
  div.classList.add("grid__toolbar__item--selected");
  document.getElementById("grid-numbers-layer").classList.remove("hidden");
  document.getElementById("grid-toolbar-item-name").innerHTML = "Numbers";
  document.getElementById("grid-number-settings").classList.remove("hidden");
}

// enable the shade circles tool and layer
function enableShadeCircleTool(div) {
  console.log("Enabling Shade Circle Tool");
  div.classList.add("grid__toolbar__item--selected");
  document.getElementById("grid-shadecircles-layer").classList.remove("hidden");
  document.getElementById("grid-toolbar-item-name").innerHTML = "Shade Circles";
  document.getElementById("grid-shadecircle-settings").classList.remove("hidden");
}

// enable the shade squares tool and layer
function enableShadeSquareTool(div) {
  console.log("Enabling Shade Square Tool");
  div.classList.add("grid__toolbar__item--selected");
  document.getElementById("grid-shadesquares-layer").classList.remove("hidden");
  document.getElementById("grid-toolbar-item-name").innerHTML = "Shade Squares";
  document.getElementById("grid-shadesquare-settings").classList.remove("hidden");
}

// select input on focus
function focusInput(input) {
  if (input.id.startsWith("answer")) {
    console.log("Focus Answer Input: " + input.id);
    state.last_answer_input = input.id;
  } else {
    console.log("Focus Number Input: " + input.id);
    state.last_number_input = input.id;
    if (!input.value) { input.value = state.last_number + 1; }
  }
  input.select();
  // document.getElementById("grid-answer-rebus-button").classList.remove("hidden");
}

// return a shade based on a percentage
function getShade(percentage) {
  var hex = Math.round((100-percentage)/100 * 255).toString(16);
  if (hex.length == 1) {
    hex = "0" + hex;
  }
  return "#" + hex + hex + hex;
}

// return the opposite direction (across/down) of the given direction
function getOpposite(dir) {
  if (dir == "across") {
    return "down"
  } else if (dir == "down") {
    return "across"
  } else {
    return null;
  }
}

// get an SVG file by URL
function getSVG(svgUrl) {
  var svg = httpGet(svgUrl);
  console.log(svg);
  parseSVG(svg);
}

// return a list of bars (including the given one) based on symmetry
function getSymmetricalBars(dir, row, col) {
  var bar = [dir, row, col];
  var symmetry = getSymmetry();

  var across_cols = puzzle.cols;
  var across_rows = puzzle.rows - 1;

  var down_cols = puzzle.cols - 1;
  var down_rows = puzzle.rows;

  if (dir == "across") {
    var diag_down = ["down", col, row];
    var diag_up = ["down", across_cols - col, across_rows - row];
    var horizontal = ["across", row, across_cols - col];
    var rotate90 = ["down", col, across_rows - row];
    var rotate180 = ["across", across_rows - row, across_cols - col];
    var rotate270 = ["down", across_cols - col, row];
    var vertical = ["across", across_rows - row, col];

  } else if (dir == "down") {
    var diag_down = ["across", col, row];
    var diag_up = ["across", down_cols - col, down_rows - row];
    var horizontal = ["down", row, down_cols - col];
    var rotate90 = ["across", down_cols - col, row];
    var rotate180 = ["down", down_rows - row, down_cols - col];
    var rotate270 = ["across", col, down_rows - row];
    var vertical = ["down", down_rows - row, col];
  }

  if (symmetry == "symmetry-none") {
    return [bar];
  } else if (symmetry == "symmetry-rotate-180") {
    return [bar, rotate180];
  } else if (symmetry == "symmetry-rotate-90") {
    return [bar, rotate90, rotate180, rotate270];
  } else if (symmetry == "symmetry-mirror-h") {
    return [bar, horizontal];
  } else if (symmetry == "symmetry-mirror-v") {
    return [bar, vertical];
  } else if (symmetry == "symmetry-mirror-d") {
    return [bar, diag_down];
  } else if (symmetry == "symmetry-mirror-u") {
    return [bar, diag_up];
  } else if (symmetry == "symmetry-mirror-4h") {
    return [bar, horizontal, rotate180, vertical];
  } else if (symmetry == "symmetry-mirror-4d") {
    return [bar, diag_down, rotate180, diag_up];
  } else if (symmetry == "symmetry-mirror-8") {
    return [bar, diag_down, rotate90, horizontal, rotate180, diag_up, rotate270, vertical];
  }
}

// get symmetry setting for creating bars
function getSymmetry() {
  return document.querySelector("input[type=radio][name=symmetry]:checked").id;
}

// hide all layers
function hideAllLayers() {
  var answers = document.getElementById("view-answers");
  if (answers.checked) {
    answers.checked = false;
    hideAnswers();
  }
  var bars = document.getElementById("view-bars");
  if (bars.checked) {
    bars.checked = false;
    hideBars();
  }
  var blocks = document.getElementById("view-blocks");
  if (blocks.checked) {
    blocks.checked = false;
    hideBlocks();
  }
  var gridlines = document.getElementById("view-grid-lines");
  if (gridlines.checked) {
    gridlines.checked = false;
    hideGridLines();
  }
  var numbers = document.getElementById("view-numbers");
  if (numbers.checked) {
    numbers.checked = false;
    hideNumbers();
  }
  var shadesquares = document.getElementById("view-shade-squares");
  if (shadesquares.checked) {
    shadesquares.checked = false;
    hideShadeSquares();
  }
  var shadecircles = document.getElementById("view-shade-circles");
  if (shadecircles.checked) {
    shadecircles.checked = false;
    hideShadeCircles();
  }
  var circles = document.getElementById("view-circles");
  if (circles.checked) {
    circles.checked = false;
    hideCircles();
  }
}

// hide the answers from the svg
function hideAnswers() {
  console.log("Hiding all Answers");
  document.getElementById("svg-answers").classList.add("hidden");
}

// hide the bars and bar join caps from the svg
function hideBars() {
  console.log("Hiding all Bars");
  document.getElementById("svg-acrossbars").classList.add("hidden");
  document.getElementById("svg-downbars").classList.add("hidden");
  document.getElementById("svg-barjoincaps").classList.add("hidden");
}

// hide the blocks from the svg
function hideBlocks() {
  console.log("Hiding all Blocks");
  document.getElementById("svg-blocks").classList.add("hidden");
}

// hid the circles from the svg
function hideCircles() {
  console.log("Hiding all Circles");
  document.getElementById("svg-circles").classList.add("hidden");
}

// hide grid lines from the svg
function hideGridLines() {
  console.log("Hiding all Grid Lines");
  document.getElementById("svg-squares").classList.add("hidden");
}

// hide the grid size conntrols and enable the other tools
function hideGridSizeControls() {
  console.log("Hiding Grid Size controls")
  document.getElementById("grid-size-control-container").classList.add("hidden");
  document.getElementById("upload-eps-tool").classList.add("hidden");
  // document.getElementById("upload-json-tool").classList.add("hidden");
  document.getElementById("upload-svg-tool").classList.add("hidden");
  console.log("Displaying Grid Toolbar, Layers Tool, Downloads Tool, and SVG Tool")
  document.getElementById("grid-toolbar").classList.remove("hidden");
  document.getElementById("grid-toolbar-item-settings").classList.remove("hidden");
  document.getElementById("layers-tool").classList.remove("hidden");
  document.getElementById("bar-join-caps-tool").classList.remove("hidden");
  // document.getElementById("save-json-tool").classList.remove("hidden");
  document.getElementById("save-svg-tool").classList.remove("hidden");
  document.getElementById("save-xml-tool").classList.remove("hidden");
}

// hide the numbers from the svg
function hideNumbers() {
  console.log("Hiding all Numbers");
  document.getElementById("svg-numbers").classList.add("hidden");
}

// hide the shade circles from the svg
function hideShadeCircles() {
  console.log("Hiding all Shade Circles");
  document.getElementById("svg-shadecircles").classList.add("hidden");
}

// hide the shide squares from the svg
function hideShadeSquares() {
  console.log("Hiding all Shade Squares");
  document.getElementById("svg-shadesquares").classList.add("hidden");
}

// http GET
function httpGet(url) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url, false); // false for synchronous request
  xmlHttp.send(null);
  return xmlHttp.responseText;
}

// initialize a new puzzle based on the dimensions
function initPuzzle() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const svgUrl = urlParams.get("svg1")
  if (svgUrl) {
      console.log("Loading SVG from URL.");
      getSVG(svgUrl);
  } else {
      puzzle.answers = createArray(puzzle.rows, puzzle.cols);
      puzzle.numbers = createArray(puzzle.rows, puzzle.cols);
      puzzle.across_bars = createArray(puzzle.rows, puzzle.cols);
      puzzle.down_bars = createArray(puzzle.rows, puzzle.cols);
      puzzle.blanks = createArray(puzzle.rows, puzzle.cols);
      puzzle.blocks = createArray(puzzle.rows, puzzle.cols);
      puzzle.circles = createArray(puzzle.rows, puzzle.cols);
      puzzle.shade_circles = createArray(puzzle.rows, puzzle.cols);
      puzzle.shade_squares = createArray(puzzle.rows, puzzle.cols);
  }
}

// load the page
function loadPage() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const svgUrl = urlParams.get("svg")
  if (svgUrl) {
    console.log("Loading SVG from URL.");
    getSVG(svgUrl);
  } else {
    initPuzzle();
    createGrid();
    updateMenus()
  }
}

// move to the next (or previous) input
function nextInput(event) {
  var key = event.keyCode || event.charCode;
  var id = event.target.id.split("-");
  var input = document.getElementById(event.target.id);
  var name = id[0];
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);

  console.log("Key Pressed: " + key);

  // do nothing for special keys
  if ([9, 16, 17, 18, 20, 91, 93].includes(key)) {}

  // return = submit change
  else if (key == 13) {
    if (event.target.id.startsWith("answer")) {
      updateAnswer(input);
    } else {
      updateNumber(input);
    }
    if (input.nextSibling && input.nextSibling.focus) {
      input.nextSibling.focus();
      input.nextSibling.select();
    }
  }

  // space = next sibling (if exists)
  else if (key == 32) {
    if (!state.rebus && input.nextSibling && input.nextSibling.focus) {
      input.nextSibling.focus();
      input.nextSibling.select();
    }
  }

  // left-arrow = previous sibling (if exists)
  else if (key == 37) {
    if (input.previousSibling && input.previousSibling.focus) {
      input.previousSibling.focus();
      input.previousSibling.select();
    }
  }

  // up-arrow = previous row (if exists)
  else if (key == 38) {
    div = document.getElementById(name + "-" + (row - 1) + "-" + col);
    if (div && div.focus) {
      div.focus();
      div.select();
    }
  }

  // right-arrow = next sibling (if exists)
  else if (key == 39) {
    if (input.nextSibling && input.nextSibling.focus) {
      input.nextSibling.focus();
      input.nextSibling.select();
    }
  }

  // down-arrow = next row (if exists)
  else if (key == 40) {
    div = document.getElementById(name + "-" + (row + 1) + "-" + col);
    if (div && div.focus) {
      div.focus();
      div.select()
    }
  }

  // delete = previous input (if current input is empty and previous input exists)
  else if (key == 8 && input.value.length == 0) {
    if (input.previousSibling && input.previousSibling.focus) {
      input.previousSibling.focus();
      input.previousSibling.select();
    }
  }

  // otherwise, if input is full, move to next input
  else if (input.value.length === parseInt(input.attributes["maxLength"].value)) {
    if (input.nextSibling && input.nextSibling.focus) {
      input.nextSibling.focus();
      input.nextSibling.select();
    }
  }

}

// parse an EPS file created by BarGrids 2
function parseEPS(eps) {
  answers = false;
  bars = false;
  numbers = false;
  shades = false;
  console.log(eps);

  for (line of eps.split(/\r|\r\n|\n/)) {
    // title
    if ("%%Title" == line.split(":")[0]) {
      puzzle.title = line.split(":")[1].trim();
    }

    // size
    if ("%%BoundingBox" == line.split(":")[0]) {
      var box = line.split(":")[1].split(" ");
      var llx = parseInt(box[1]);
      var lly = parseInt(box[2]);
      var urx = parseInt(box[3]);
      var ury = parseInt(box[4]);
      x = urx - llx;
      y = ury - lly;
      cols = (x - 2)/20;
      rows = (y - 2)/20;
      console.log("Rows: " + rows + ", Cols: " + cols);
      puzzle.cols = cols;
      puzzle.rows = rows;
      initPuzzle();
    }

    // Answers
    if (line == "%Grid Array") {
      row = 0;
      answers = true;
      continue;
    }
    if (line == "] def") {
      answers = false;
      continue;
    }
    if (answers == true) {
      if (line == "/grid [") {
        continue;
      }
      puzzle.answers[row] = line.split("").slice(1,-1);
      row++;
    }

    // Numbers
    if (line == "% Begin Numbers") {
      numbers = true;
      continue;
    }
    if (line == "% End Numbers") {
      numbers = false;
      continue;
    }
    if (numbers == true) {
      var num = line.split(" ");
      row = parseInt(num[0].replace("%", "")) - 1;
      col = parseInt(num[1]) - 1;
      val = num[2].slice(1, -1);
      console.log("number-" + row + "-" + col + " = " + val);
      puzzle.numbers[row][col] = val;
    }

    // Bars
    if (line == "% Begin Bars") {
      bars = true;
      continue;
    }
    if (line == "% End Bars") {
      bars = false;
      continue;
    }
    if (bars == true) {
      var num = line.split(" ");
      if (num[2] == "vbar") {
        row = parseInt(num[0]);
        col = parseInt(num[1]);
        console.log("acrossbar-" + " " + row + "-" + col);
        puzzle.across_bars[row][col] = true;
      } else if (num[2] == "hbar") {
        row = parseInt(num[0]);
        col = parseInt(num[1]);
        console.log("downbar-" + " " + row + "-" + col);
        puzzle.down_bars[row][col] = true;
      } else if (num[2] == "cap" && !puzzle.bar_join_caps) {
        console.log("Bar join caps enabled.");
        puzzle.bar_join_caps = true;
      }
    }

    // Shades
    if (line == "% Begin Shades") {
      shades = true;
      continue;
    }
    if (line == "% End Shades") {
      shades = false;
      continue;
    }
    if (shades == true) {
      var num = line.split(" ");
      if (num[3] == "sb") {
        row = parseInt(num[0] - 1);
        col = parseInt(num[1] - 1);
        console.log(num[2] + " " + row + "-" + col);
        puzzle.shade_squares[row][col] = parseInt(num[2]);
      } else if (num[3] == "sc") {
        row = parseInt(num[0] - 1);
        col = parseInt(num[1] - 1);
        console.log(num[2] + " " + row + "-" + col);
        puzzle.shade_circles[row][col] = parseInt(num[2]);
      } else if (num[3] == "oc") {
        row = parseInt(num[0] - 1);
        col = parseInt(num[1] - 1);
        console.log(num[2] + " " + row + "-" + col);
        puzzle.circles[row][col] = true;
      }
    }

  }
  createGrid();
  hideGridSizeControls();
}

// parse an SVG file
function parseSVG(string) {
  var parser = new DOMParser();
  var svg = parser.parseFromString(string, "image/svg+xml").documentElement;

  // import basic data
  puzzle.cols = parseInt(svg.getAttribute("data-cols"));
  puzzle.rows = parseInt(svg.getAttribute("data-rows"));
  puzzle.title = svg.getAttribute("data-title");

  // initialize the puzzle data
  initPuzzle();

  var answers = svg.getElementById("svg-answers");
  for (answer of answers.children) {
    var col = parseInt(answer.getAttribute("data-col"));
    var row = parseInt(answer.getAttribute("data-row"));
    puzzle.answers[row][col] = answer.innerHTML;
  }

  var blanks = svg.getElementById("svg-blanks");
  if (blanks && blanks.children) {
    for (blank of blanks.children) {
      var col = parseInt(blank.getAttribute("data-col"));
      var row = parseInt(blank.getAttribute("data-row"));
      puzzle.blanks[row][col] = true;
    }
  }

  var blocks = svg.getElementById("svg-blocks");
  if (blocks && blocks.children) {
    for (block of blocks.children) {
      var col = parseInt(block.getAttribute("data-col"));
      var row = parseInt(block.getAttribute("data-row"));
      puzzle.blocks[row][col] = true;
    }
  }

  var numbers = svg.getElementById("svg-numbers");
  for (number of numbers.children) {
    var col = parseInt(number.getAttribute("data-col"));
    var row = parseInt(number.getAttribute("data-row"));
    puzzle.numbers[row][col] = number.innerHTML;
  }

  var across_bars = svg.getElementById("svg-acrossbars");
  for (across_bar of across_bars.children) {
    var col = parseInt(across_bar.getAttribute("data-col"));
    var row = parseInt(across_bar.getAttribute("data-row"));
    puzzle.across_bars[row][col] = true;
  }

  var down_bars = svg.getElementById("svg-downbars");
  for (down_bar of down_bars.children) {
    var col = parseInt(down_bar.getAttribute("data-col"));
    var row = parseInt(down_bar.getAttribute("data-row"));
    puzzle.down_bars[row][col] = true;
  }

  var barjoincaps = svg.getElementById("svg-barjoincaps");
  if (!barjoincaps.children) {
    puzzle.bar_join_caps = false;
  }

  var circles = svg.getElementById("svg-circles");
  for (circle of circles.children) {
    var col = parseInt(circle.getAttribute("data-col"));
    var row = parseInt(circle.getAttribute("data-row"));
    puzzle.circles[row][col] = true;
  }

  var shade_squares = svg.getElementById("svg-shadesquares");
  for (shade_square of shade_squares.children) {
    var col = parseInt(shade_square.getAttribute("data-col"));
    var row = parseInt(shade_square.getAttribute("data-row"));
    puzzle.shade_squares[row][col] = parseInt(shade_square.getAttribute("data-value"));;
  }

  var shade_circles = svg.getElementById("svg-shadecircles");
  for (shade_circle of shade_circles.children) {
    var col = parseInt(shade_circle.getAttribute("data-col"));
    var row = parseInt(shade_circle.getAttribute("data-row"));
    puzzle.shade_circles[row][col] = parseInt(shade_circle.getAttribute("data-value"));
  }

  createGrid();
  hideGridSizeControls();

}

// remove all children from an element by ID
function removeChildren(elements) {
  if (!elements) {
    return;
  }
  while (elements.firstChild) {
    elements.removeChild(elements.firstChild);
  }
}

// save a JSON file to the downloads folder
function saveJSON() {
  var link = document.getElementById("json-download");
  var source = JSON.stringify(puzzle);
  var url = "data:text/json;charset=utf-8," + encodeURIComponent(source);
  link.href = url;
  link.download = puzzle.title + ".json";
  link.click();
}

// save an SVG file to the downloads folder
function saveSVG() {
  var link = document.getElementById("svg-download");
  var svg = document.getElementById("grid");
  var source = createSVGSource(svg);
  var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
  link.href = url;
  link.download = puzzle.title + ".svg";
  link.click();
}

// save an XML file to the downloads folder
function saveXML() {
  var link = document.getElementById("xml-download");
  // var xml = document.getElementById("grid");
  var source = createXMLSource();
  var url = "data:text/xml;charset=utf-8," + encodeURIComponent(source);
  link.href = url;
  link.download = puzzle.title + ".xml";
  link.click();
}

// set the depth of the puzzle by updating the text input
function setDepth(value) {
  console.log("Setting Grid Depth: " + value);
  puzzle.rows = parseInt(value);
  initPuzzle();
  createGrid();
}

// set the width of the puzzle by updating the text input
function setWidth(value) {
  console.log("Setting Grid Width: " + value);
  puzzle.cols = parseInt(value);
  initPuzzle();
  createGrid();
}

// show all svg layers
function showAllLayers() {
  var answers = document.getElementById("view-answers");
  if (!answers.checked) {
    answers.checked = true;
    showAnswers();
  }
  var bars = document.getElementById("view-bars");
  if (!bars.checked) {
    bars.checked = true;
    showBars();
  }
  var blocks = document.getElementById("view-blocks");
  if (!blocks.checked) {
    blocks.checked = true;
    showBlocks();
  }
  var gridlines = document.getElementById("view-grid-lines");
  if (!gridlines.checked) {
    gridlines.checked = true;
    showGridLines();
  }
  var numbers = document.getElementById("view-numbers");
  if (!numbers.checked) {
    numbers.checked = true;
    showNumbers();
  }
  var shadesquares = document.getElementById("view-shade-squares");
  if (!shadesquares.checked) {
    shadesquares.checked = true;
    showShadeSquares();
  }
  var shadecircles = document.getElementById("view-shade-circles");
  if (!shadecircles.checked) {
    shadecircles.checked = true;
    showShadeCircles();
  }
  var circles = document.getElementById("view-circles");
  if (!circles.checked) {
    circles.checked = true;
    showCircles();
  }
}

// show svg answers layer
function showAnswers() {
  console.log("Showing all Answers");
  document.getElementById("svg-answers").classList.remove("hidden");
}

// show svg bars layer
function showBars() {
  console.log("Showing all Bars");
  document.getElementById("svg-acrossbars").classList.remove("hidden");
  document.getElementById("svg-downbars").classList.remove("hidden");
  document.getElementById("svg-barjoincaps").classList.remove("hidden");
}

// show svg blocks layer
function showBlocks() {
  console.log("Showing all Blocks");
  document.getElementById("svg-blocks").classList.remove("hidden");
}

// show svg circles layer
function showCircles() {
  console.log("Showing all Circles");
  document.getElementById("svg-circles").classList.remove("hidden");
}

// show svg grid lines layer
function showGridLines() {
  console.log("Showing all Grid Lines");
  document.getElementById("svg-squares").classList.remove("hidden");
}

// show svg numbers layer
function showNumbers() {
  console.log("Showing all Numbers");
  document.getElementById("svg-numbers").classList.remove("hidden");
}

// show svg shade circles layer
function showShadeCircles() {
  console.log("Showing all Shade Circles");
  document.getElementById("svg-shadecircles").classList.remove("hidden");
}

// show svg shade squares layer
function showShadeSquares() {
  console.log("Showing all Shade Squares");
  document.getElementById("svg-shadesquares").classList.remove("hidden");
}

// toggle svg answers layer
function toggleAnswerLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Answers");
    showAnswers();
  } else {
    console.log("Disabling Layer: Answers");
    hideAnswers();
  }
}

// toggle bar join caps
function toggleBarJoinCaps(input) {
  if (!puzzle.bar_join_caps) {
    console.log("Enabling Bar Join Caps");
    puzzle.bar_join_caps = true;
  } else {
    console.log("Disabling Bar Join Caps");
    puzzle.bar_join_caps = false;
  }
  createGrid();
}

// toggle svg bars layer
function toggleBarLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Bars");
    showBars();
  } else {
    console.log("Disabling Layer: Bars");
    hideBars();
  }
}

// toggle svg blocks layer
function toggleBlockLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Blocks");
    showBlocks();
  } else {
    console.log("Disabling Layer: Blocks");
    hideBlocks();
  }
}

// toggle svg circles layer
function toggleCircleLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Circles");
    showCircles();
  } else {
    console.log("Disabling Layer: Circles");
    hideCircles();
  }
}

// toggle grid line layer
function toggleGridLineLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Grid Lines");
    showGridLines();
  } else {
    console.log("Disabling Layer: Grid Lines");
    hideGridLines();
  }
}

// toggle svg numbers layer
function toggleNumberLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Numbers");
    showNumbers();
  } else {
    console.log("Disabling Layer: Numbers");
    hideNumbers();
  }
}

// toggle rebus feature for answer entry
function toggleRebus() {
  var answers = document.getElementById("grid-answers-layer");
  var rebus = document.getElementById("grid-answer-rebus-button");
  if (!state.rebus) {
    console.log("Enabling Rebus feature");
    state.rebus = true;
    rebus.innerHTML = "Rebus";
    for (answer of answers.children) {
      answer.maxLength = "5";
    }
  } else {
    console.log("Disabling Rebus feature");
    state.rebus = false;
    rebus.innerHTML = "Single Character";
    for (answer of answers.children) {
      answer.maxLength = "1";
    }
  }
  // rebus.classList.remove("hidden");
  // var input = document.getElementById(state.last_answer_input);
  // input.focus();
}

// toggle svg shade circles layer
function toggleShadeCircleLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Shade Circles");
    showShadeCircles();
  } else {
    console.log("Disabling Layer: Shade Circles");
    hideShadeCircles();
  }
}

// toggle svg shade squares layer
function toggleShadeSquareLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Shade Squares");
    showShadeSquares();
  } else {
    console.log("Disabling Layer: Shade Squares");
    hideShadeSquares();
  }
}

// toggle a tool by div
function toggleTool(div) {
  if (div.classList.contains("grid__toolbar__item--selected")) {
    disableTool(div);
    document.getElementById("grid-toolbar-item-name").innerHTML = "No tool selected";
  } else {
    for (item of document.getElementsByClassName("grid__toolbar__item__wrapper")) {
      if (item.classList.contains("grid__toolbar__item--selected")){
        disableTool(item);
      }
    }
    enableTool(div);
  }
}

// update an across bar
function updateAcrossBar(row, col) {
  if (puzzle.across_bars[row][col]) {
    console.log("Disabling Across Bar: " + row + "-" + col);
    puzzle.across_bars[row][col] = false;
  } else {
    console.log("Enabling Across Bar: " + row + "-" + col);
    puzzle.across_bars[row][col] = true;
  }
  createGrid();
}

// update one or more across bars based on symmetry settings
function updateAcrossBars(div) {
  var id = div.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  var bars = getSymmetricalBars("across", row, col);
  var names = [];
  for (bar of bars) {
    name = bar[0] + "-" + bar[1] + "-" + bar[2];
    if (names.includes(name)) { continue; }
    else { names.push(name); }
    if (bar[0] == "across") {
      updateAcrossBar(bar[1], bar[2]);
    } else if (bar[0] == "down") {
      updateDownBar(bar[1], bar[2]);
    }
  }
}

// update an individual answer
function updateAnswer(input) {
  var answer = input.value.trim().toUpperCase();
  var id = input.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  console.log("Updating Answer: row: " + row + ", col: " + col + ": " + answer);
  if (answer) {
    puzzle.answers[row][col] = answer;
  } else {
    puzzle.answers[row][col] = null;
  }
  createGridSVG();
}

// update a blank
function updateBlank(div) {
  var id = div.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  if (puzzle.blanks[row][col]) {
    console.log("Disabling Blank: " + id);
    puzzle.blanks[row][col] = false;
  } else {
    console.log("Enabling Blank: " + id);
    puzzle.blanks[row][col] = true;
  }
  createGrid();
}

// update a block
function updateBlock(div) {
  var id = div.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  if (puzzle.blocks[row][col]) {
    console.log("Disabling Block: " + id);
    puzzle.blocks[row][col] = false;
  } else {
    console.log("Enabling Block: " + id);
    puzzle.blocks[row][col] = true;
  }
  createGrid();
}

// update a circle
function updateCircle(div) {
  var id = div.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  if (puzzle.circles[row][col]) {
    console.log("Disabling Circle: " + id);
    puzzle.circles[row][col] = false;
  } else {
    console.log("Enabling Circle: " + id);
    puzzle.circles[row][col] = true;
  }
  createGrid();
}

// update a down bar
function updateDownBar(row, col) {
  if (puzzle.down_bars[row][col]) {
    console.log("Disabling Down Bar: " + row + "-" + col);
    puzzle.down_bars[row][col] = false;
  } else {
    console.log("Enabling Down Bar: " + row + "-" + col);
    puzzle.down_bars[row][col] = true;
  }
  createGrid();
}

// update one or more down bars based on symmetry settings
function updateDownBars(div) {
  var id = div.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  var bars = getSymmetricalBars("down", row, col);
  var names = [];
  for (bar of bars) {
    name = bar[0] + "-" + bar[1] + "-" + bar[2];
    if (names.includes(name)) { continue; }
    else { names.push(name); }
    if (bar[0] == "across") {
      updateAcrossBar(bar[1], bar[2]);
    } else if (bar[0] == "down") {
      updateDownBar(bar[1], bar[2]);
    }
  }
}

// update font
function updateFont(select) {
  var selected = select.options[select.selectedIndex];
  if (select.id.startsWith("answer")) {
    console.log("Setting Answer Font to: " + selected.innerHTML);
    puzzle.answer_font_family = selected.innerHTML;
  } else {
    console.log("Setting Number Font to: " + selected.innerHTML);
    puzzle.number_font_family = selected.innerHTML;
  }
  createGrid();
}

// update font menu
function updateFontMenu(id) {
  var select = document.getElementById(id);
  var fonts = [
    "American Typewriter",
    "Andalé Mono",
    "Arial Black",
    "Arial",
    "Bradley Hand",
    "Brush Script MT",
    "Comic Sans MS",
    "Courier",
    "Didot",
    "Georgia",
    "Helvetica",
    "Impact",
    "Lucida Console",
    "Luminari",
    "Monaco",
    "Tahoma",
    "Times New Roman",
    "Trebuchet MS",
    "Verdana",
  ];
  for (font of fonts) {
    var opt = document.createElement("option");
    opt.innerHTML = font;
    if (id.startsWith("answer")) {
      if (puzzle.answer_font_family == font) {
        opt.selected = true;
      }
    } else {
      if (puzzle.number_font_family == font) {
        opt.selected = true;
      }
    }
    select.appendChild(opt);
  }
}

// update the size of the grid after changing the dimensions
function updateGridSize(select) {
  // get the grid size from the select selection
  var grid_size = select.options[select.selectedIndex].id.split("x");

  // set the puzzle dimensions
  puzzle.cols = parseInt(grid_size[0]);
  puzzle.rows = parseInt(grid_size[1]);
  console.log("Updating Grid Size: " + puzzle.rows + " rows, " + puzzle.cols + " cols")

  // update the width and depth inputs to match the selection
  document.getElementById("width").value = puzzle.cols;
  document.getElementById("depth").value = puzzle.rows;

  // reset the select element
  select.selectedIndex = 0;

  // draw a new grid with the new dimensions
  initPuzzle();
  createGrid();
}

// update the dropdown menus
function updateMenus() {
  updateFontMenu("answer-font-menu");
  updateFontMenu("number-font-menu");
}

// update an individual number
function updateNumber(input) {
  var number = input.value.trim();
  var id = input.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  console.log("Updating Number: row: " + row + ", col: " + col + ": " + number);
  if (number) {
    puzzle.numbers[row][col] = number;
    state.last_number = parseInt(number);
  } else {
    puzzle.numbers[row][col] = null;
  }
  createGridSVG();
}

// update a shade circle
function updateShadeCircle(div) {
  var id = div.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  var value = document.getElementById("grid-shadecircle-slider-input").value;
  if (puzzle.shade_circles[row][col]) {
    console.log("Disabling Shade Circle: " + id);
    puzzle.shade_circles[row][col] = 0;
  } else {
    console.log("Enabling Shade Circle: " + id);
    puzzle.shade_circles[row][col] = parseInt(value);
  }
  createGrid();
}

// update the shade circle slider label
function updateShadeCircleSlider() {
  var value = document.getElementById("grid-shadecircle-slider-input").value;
  document.getElementById("grid-shadecircle-slider-label").innerHTML = value + "%";
  document.getElementById("grid-shadecircle-toolbar-item").style.background = getShade(value);
}

// update a shade square
function updateShadeSquare(div) {
  var id = div.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  var value = document.getElementById("grid-shadesquare-slider-input").value;
  console.log(value);
  if (puzzle.shade_squares[row][col]) {
    console.log("Disabling Shade Square: " + id);
    puzzle.shade_squares[row][col] = 0;
  } else {
    console.log("Enabling Shade Square: " + id);
    puzzle.shade_squares[row][col] = parseInt(value);
  }
  createGrid();
}

// update the shade square slider label
function updateShadeSquareSlider() {
  var value = document.getElementById("grid-shadesquare-slider-input").value;
  document.getElementById("grid-shadesquare-slider-label").innerHTML = value + "%";
  document.getElementById("grid-shadesquare-toolbar-item").style.background = getShade(value);
}

// update the title
function updateTitle(title) {
  console.log("Updating Title: " + title);
  puzzle.title = title;
  document.title = title;
  createGrid();
}

// upload an eps file
function uploadEPSFile(input) {
  var file = input.files[0];
  var filename = file.name;
  console.log("File Name: " + filename);

  var reader = new FileReader();
  reader.readAsText(file, "UTF-8");
  reader.onload = function (event) {
    parseEPS(event.target.result);
  }
  reader.onerror = function (event) {
      alert("Error reading file: " + filename);
  }
}

// click the upload eps button
function uploadEPSFileButton() {
  var input = document.getElementById("upload-eps-button");
  input.click();
}

// upload a json file
function uploadJSONFile(input) {
  var file = input.files[0];
  var filename = file.name;
  console.log("File Name: " + filename);

  var reader = new FileReader();
  reader.readAsText(file, "UTF-8");
  console.log("after read as text");
  reader.onload = function (event) {
    puzzle = JSON.parse(event.target.result);
    console.log(puzzle);
    createGrid();
    hideGridSizeControls();
    document.getElementById("bar-join-caps").checked = puzzle.bar_join_caps;
  }
  reader.onerror = function (event) {
      alert("Error reading file: " + filename);
  }
}

// click the json upload button
function uploadJSONFileButton() {
  var input = document.getElementById("upload-json-button");
  input.click();
}

// upload an svg file
function uploadSVGFile(input) {
  var file = input.files[0];
  var filename = file.name;
  console.log("File Name: " + filename);

  var reader = new FileReader();
  reader.readAsText(file, "UTF-8");
  reader.onload = function (event) {
    parseSVG(event.target.result);
  }
  reader.onerror = function (event) {
      alert("Error reading file: " + filename);
  }
}

// click the upload svg button
function uploadSVGFileButton() {
  var input = document.getElementById("upload-svg-button");
  input.click();
}
