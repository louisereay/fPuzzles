// ==UserScript==
// @name         Fpuzzles-PallandoConstraints
// @version      1.27
// @namespace    http://tampermonkey.net/
// @description  Adds Clockline, Weak Palindrome Line, anti-palindrome, chinese whispers, Sweepercell and SumDot constraints to Fpuzzles
// @author       Kittiaara
// @match        https://*.f-puzzles.com/*
// @match        https://f-puzzles.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  // Adding a new constraint:
  // 1. Add a new entry to the newConstraintInfo array
  // 2. If the type is not already supported, add it to the following:
  //      a. exportPuzzle
  //      b. importPuzzle
  //      c. categorizeTools
  //      d. Add a drawing helper function for what it looks like
  // 3. Add conflict highlighting logic to candidatePossibleInCell
  // 4. Add a new constraint class (see 'Constraint classes' comment)

  const clockLineName = 'Clock';
  const weakPalindromeName = 'Weak Palindrome';
  const antiPalindromeName = 'AntiPalindrome';
  const sweeperCellName = 'Sweeper Cell';
  const chineseWhisperName = 'Chinese Whispers';
  const sumDotName = 'Sum Dot (Border)';
  const cornerSumDotName = 'Sum Dot (Intersection)';


  const newLineConstraintInfo = [
    {
      name: clockLineName,
      type: 'line',
      color: '#FFD500',
      colorDark: '#FFD500',
      lineWidth: 0.25,
      tooltip: [
        'Adjacent cells on a clock line contain digits that are 2 hours apart on a clock going from 1 to 9',
        '[For non-9x9 grid sizes, the clock goes from 1 to size.]',
        '',
        'Click and drag to draw a clock line.',
        'Click on a clock line to remove it.',
        'Shift click and drag to draw overlapping clock lines.',
      ],
      constraintType: 'isClockConstraint',
      constraintLayer: 'Bottom'
  },
    {
      name: chineseWhisperName,
      type: 'line',
      color: '#2FFF00',
      colorDark: '#2FFF00',
      lineWidth: 0.25,
      tooltip: [
        'Adjacent cells on a chinese whispers line contain digits that are either 0 or 1 apart.',
        '',
        'Click and drag to draw a clock line.',
        'Click on a clock line to remove it.',
        'Shift click and drag to draw overlapping clock lines.',
      ],
      constraintType: 'isChineseWhisperConstraint',
      constraintLayer: 'Bottom'
    },
    {
      name: weakPalindromeName,
      type: 'lineWithDot',
      color: '#A28CFF' ,
      colorDark: '#A28CFF',
      lineWidth: 0.25,
      tooltip: [
        'corresponding digits match in both High(56789)-vs-Low(1234) and in Odd(13579)-vs-Even(2468)',
        '',
        'Click and drag to draw a weak palindrome line.',
        'Click on a weak palindrome line to remove it.',
        'Shift click and drag to draw overlapping weak palindrome lines.',
      ],
      constraintType: 'isWeakPalindromeConstraint',
      constraintLayer: 'Bottom'
    },
    {
      name: antiPalindromeName,
      type: 'lineWithDot',
      color: '#FF0000',
      colorDark: '#FF0000',
      lineWidth: 0.25,
      tooltip: [
        'corresponding digits sum to the size of the grid + 1. For a 9x9, this would be 10.',
        '',
        'Click and drag to draw an anti-palindrome line.',
        'Click on an anti-palindrome line to remove it.',
        'Shift click and drag to draw overlapping weak palindrome lines.'
      ],
      constraintType: 'isAntiPalindromeConstraint',
      constraintLayer: 'Bottom'
    }
  ];

  const newCellConstraintInfo = [
    {
      name: sweeperCellName,
      type: 'sweeper',
      color: '#651010',
      colorDark: '#FFFFFF',
      tooltip: [
        "The digit inside a sweeper square says how many of digits within a king's ",
        'move of it (including itself) match the condition the square is labeled with.',
        'Type a number to add a constraint type:',
        '[example ranges are for 9x9 grids. Other grid sizes will adjust valid numbers as appropriate]',
        '',
        ' 1: Doubles (1248)   2: Evens (2468)    3: Fibonacci (12358)',
        ' 4: Highs (56789)    5: Lows (1234)      6: Odds (13579)',
        ' 7: Primes (2357)     8: Squares (149)   9: Triangles (136)',
        '',
        'Click to add a sweeper cell.',
        'Click on a sweeper cell to remove it.'
      ],
      constraintType: 'isSweeperCellConstraint',
      flagged: true,
      flagDescription: [
        'Count does not include the sweeper cell itself.'
      ],
      typable: true,
      constraintLayer: 'Bottom'
    }
  ];

  const newDotConstraintInfo = [
    {
      name: sumDotName,
      type: 'sumdot',
      color: '#AB7D00',
      modalcolor: '#007DAB',
      tooltip: [
        'The number in the dot is the sum of the cells the dot touches.',
        '',
        'Click to add a sum dot then type the assigned sum.',
        'Click on a sum dot to remove it.'
      ],
      constraintType: 'isSumDotConstraint',
      flagged: true,
      flagDescription: [
        'Sum is mod [grid size]'
      ],
      typable: true,
      border: true,
      constraintLayer: 'Top'
    },
    {
      name: cornerSumDotName,
      type: 'sumdot',
      color: '#AB7D00',
      modalcolor: '#007DAB',
      tooltip: [
        'The number in the dot is the sum of the cells the dot touches.',
        '',
        'Click to add a sum dot then type the assigned sum.',
        'Click on a sum dot to remove it.'
      ],
      constraintType: 'isSumDotConstraint',
      flagged: true,
      flagDescription: [
        'Sum is mod [grid size]'
      ],
      typable: true,
      corner: true,
      constraintLayer: 'Top'
    }
  ];

  const newConstraintInfo = [...newLineConstraintInfo, ...newCellConstraintInfo, ...newDotConstraintInfo];

  var flaggableConstraints = [];

  const doShim = function() {

  const clockLineClass = cID(clockLineName);
  const weakPalindromeClass = cID(weakPalindromeName);
  const antiPalindromeClass = cID(antiPalindromeName);
  const sweeperCellClass = cID(sweeperCellName);
  const chineseWhisperClass = cID(chineseWhisperName);
  const sumDotClass = cID(sumDotName);
  const cornerSumDotClass = cID(cornerSumDotName);


    // Additional import/export data
    const origExportPuzzle = exportPuzzle;
    exportPuzzle = function(includeCandidates) {
      const compressed = origExportPuzzle(includeCandidates);
      const puzzle = JSON.parse(compressor.decompressFromBase64(compressed));

      // Move flags from negative to pallandoflags
      if (puzzle.negative) {
        puzzle.pallandoflags = puzzle.negative.filter(neg=>(flaggableConstraints.indexOf(neg)>-1));
        puzzle.negative = puzzle.negative.filter(neg=>(flaggableConstraints.indexOf(neg)<0));
        if (puzzle.negative.length===0) {delete puzzle.negative;}
      }

      // Add cosmetic version of constraints for those not using the script
      for (let constraintInfo of newConstraintInfo) {
        const id = cID(constraintInfo.name);
        const puzzleEntry = puzzle[id];
        if (puzzleEntry && puzzleEntry.length > 0) {
          if (constraintInfo.type === 'sweeper') {
            if (!puzzle.cage) puzzle.cage = [];
            if (!puzzle.rectangle) puzzle.rectangle = [];
            for (let instance of puzzleEntry) {
              let cageText = {
                "cells": [instance.cell],
                "value": instance.value,
                "outlineC": "#00000002",
                "fontC": constraintInfo.color,
              };
              let classname = cID(constraintInfo.name);
              let baseC = "#FFFFFF00";
              if (constraints[classname].negative) {
                baseC = constraintInfo.color.substring(0,7) + '30';
              }

              let rectangleText =  {
                "cells": [instance.cell],
                "baseC": baseC,
                "outlineC": constraintInfo.color,
                "fontC": constraintInfo.color,
                "width": 0.85,
                "height": 0.85
              };
              cageText[constraintInfo.constraintType] = true;
              rectangleText[constraintInfo.constraintType] = true;
              puzzle.cage.push(cageText);
              puzzle.rectangle.push(rectangleText);
            }
          }
          if (constraintInfo.type === 'line') {
            if (!puzzle.line) {
              puzzle.line = [];
            }
            for (let instance of puzzleEntry) {
              const lineText = {
                "lines": instance.lines,
                "outlineC": constraintInfo.color,
                "width": constraintInfo.lineWidth,
              };
              lineText[constraintInfo.constraintType] = true;
              puzzle.line.push(lineText);
            }
          }
          if (constraintInfo.type === 'lineWithDot') {
            if (!puzzle.line) {
              puzzle.line = [];
            }
            if (!puzzle.circle) {
              puzzle.circle = [];
            }
            for (let instance of puzzleEntry) {
              const lineText = {
                "lines": instance.lines,
                "outlineC": constraintInfo.color,
                "width": constraintInfo.lineWidth,
              };
              lineText[constraintInfo.constraintType] = true;
              puzzle.line.push(lineText);
              const line = instance.lines[0];
              const cells = [];
              const cell_1 = line[Math.floor((line.length-1)/2)];
              cells.push(cell_1);
              if ((line.length % 2) == 0) {
                const cell_2 = line[Math.ceil((line.length-1)/2)];
                cells.push(cell_2);
              }
              const circleText = {
                "cells": cells,
                "baseC": constraintInfo.color,
                "outlineC": "#00000000",
                "fontC": "#00000000",
                "width": "0.25",
                "height": "0.25"
              };
              circleText[constraintInfo.constraintType] = true;
              puzzle.circle.push(circleText);
            }
          }
          if (constraintInfo.type ==='sumdot') {
            if (!puzzle.circle) {
              puzzle.circle = [];
            }
            if (!puzzle.rectangle) {
              puzzle.rectangle = [];
            }
            if (!puzzle.text) {
              puzzle.text = [];
            }
            let colour = constraintInfo.color;
            let classname = cID(constraintInfo.name);
            if (constraints[classname].negative) {
              colour = constraintInfo.modalcolor;
            }
            for (let instance of puzzleEntry) {
              const circleText = {
                "cells": instance.cells,
                "baseC": "#FFFFFF",
                "outlineC": colour,
                "fontC": "#000000",
                "width": "0.35",
                "height": "0.35"
              }
              circleText[constraintInfo.constraintType] = true;
              const rectangleText = {
                "cells": instance.cells,
                "baseC": colour,
                "outlineC": colour,
                "fontC": "#000000",
                "width": "0.35",
                "height": "0.35",
                "angle": "45"
              }
              rectangleText[constraintInfo.constraintType] = true;
              const textText = {
                "cells": instance.cells,
                "value": instance.value,
                "fontC": "#000000",
                "size": "0.35"
              }
              textText[constraintInfo.constraintType] = true;
              puzzle.circle.push(circleText);
              puzzle.rectangle.push(rectangleText);
              puzzle.text.push(textText);
            }
          }
        }
      }
      return compressor.compressToBase64(JSON.stringify(puzzle));
    }

    const origImportPuzzle = importPuzzle;
    importPuzzle = function(string, clearHistory) {
      const puzzle = JSON.parse(compressor.decompressFromBase64(string));
      // translate flagged to negativableConstraints
      if (puzzle.pallandoflags) {
        if (!puzzle.negative) {puzzle.negative = [];}
        for (let flag of puzzle.pallandoflags) {puzzle.negative.push(flag);}
        delete puzzle.pallandoflags;
      }
      // Remove any generated cosmetics
      if (puzzle.line) {
        puzzle.line = puzzle.line.filter(line => !(
          line.isClockConstraint ||
          line.isWeakPalindromeConstraint ||
          line.isAntiPalindromeConstraint ||
          line.isChineseWhisperConstraint
        ));
        if (puzzle.line.length === 0) {
          delete puzzle.line;
        }
      }
      if (puzzle.circle) {
        puzzle.circle = puzzle.circle.filter(circle => !(
          circle.isWeakPalindromeConstraint ||
          circle.isAntiPalindromeConstraint ||
          circle.isSumDotConstraint
        ));
        if (puzzle.circle.length === 0) {
          delete puzzle.circle;
        }
      }
      if (puzzle.cage) {
        puzzle.cage = puzzle.cage.filter(cage => !(
          cage.isSweeperCellConstraint)
        );
        if (puzzle.cage.length === 0) {
          delete puzzle.cage;
        }
      }
      if (puzzle.rectangle) {
        puzzle.rectangle = puzzle.rectangle.filter(rectangle => !(
          rectangle.isSumDotConstraint ||
          rectangle.isSweeperCellConstraint)
        );
        if (puzzle.rectangle.length === 0) {
          delete puzzle.rectangle;
        }
      }
      if (puzzle.text) {
        puzzle.text = puzzle.text.filter(text => !(
          text.isSumDotConstraint
        ));
        if (puzzle.text.length === 0) {
          delete puzzle.text;
        }
      }
      string = compressor.compressToBase64(JSON.stringify(puzzle));
      origImportPuzzle(string, clearHistory);
    }

    // Draw the new constraints
    const origDrawConstraints = drawConstraints;
    drawConstraints = function(layer) {
      if (layer === 'Bottom') {
        for (let info of newConstraintInfo) {
          const id = cID(info.name);
          const constraint = constraints[id];
          if (constraint && (info.constraintLayer === 'Bottom')) {
            for (let a = 0; a < constraint.length; a++) {
              constraint[a].show();
            }
          }
        }
      }
      if (layer === 'Top') {
        for (let info of newConstraintInfo) {
          const id = cID(info.name);
          const constraint = constraints[id];
          if (constraint && (info.constraintLayer === 'Top')) {
            for (let a = 0; a < constraint.length; a++) {
              constraint[a].show();
            }
          }
        }
      }
      origDrawConstraints(layer);
    }

    // Conflict highlighting for new constraints
    const origCandidatePossibleInCell = candidatePossibleInCell;
    candidatePossibleInCell = function(n, cell, options) {
      if (!options) {
        options = {};
      }
      if (!options.bruteForce && cell.value) {
        return cell.value === n;
      }

      if (!origCandidatePossibleInCell(n, cell, options)) {
        return false;
      }

      // Clock
      const constraintsClock = constraints[clockLineClass];
      if (constraintsClock && constraintsClock.length > 0) {
        for (let clock of constraintsClock) {
          for (let line of clock.lines) {
            const index = line.indexOf(cell);
            if (index > -1) {
              if (index > 0) {
                const prevCell = line[index - 1];
                if (prevCell.value && ((Math.abs(prevCell.value - n) != 2) && (Math.abs(prevCell.value - n) != (size-2)))) {
                  return false;
                }
              }
              if (index < line.length - 1) {
                const nextCell = line[index + 1];
                if (nextCell.value && ((Math.abs(nextCell.value - n) != 2) && (Math.abs(nextCell.value - n) != (size-2)))) {
                  return false;
                }
              }
            }
          }
        }
      }

      // Chinese Whispers
      const constraintsCWhisper = constraints[chineseWhisperClass];
      if (constraintsCWhisper && constraintsCWhisper.length > 0) {
        for (let cWhisper of constraintsCWhisper) {
          for (let line of cWhisper.lines) {
            const index = line.indexOf(cell);
            if (index > -1) {
              if (index > 0) {
                const prevCell = line[index - 1];
                if (prevCell.value && ((Math.abs(prevCell.value - n) > 1))) {
                  return false;
                }
              }
            }
          }
        }
      }

      // Weak Palindrome
      const constraintsWPal = constraints[weakPalindromeClass];
      if (constraintsWPal && constraintsWPal.length > 0) {
        for (let wpal of constraintsWPal) {
          for (let line of wpal.lines) {
            const index = line.indexOf(cell);
            if (index > -1) {
              const mirrorIndex = ( line.length - (index + 1));
              const border = Math.floor(size/2) + 1;
              const mirrorCell=line[mirrorIndex];
              if (mirrorCell.value && (((n % 2) != (mirrorCell.value % 2)) || ( (Math.floor(n / border)) != (Math.floor(mirrorCell.value / border)) ))) {
                return false;
              }
            }
          }
        }
      }

      // Anti-Palindrome
      const constraintsAntiPal = constraints[antiPalindromeClass];
      if (constraintsAntiPal && constraintsAntiPal.length > 0) {
        for (let aPal of constraintsAntiPal) {
          for (let line of aPal.lines) {
            const index = line.indexOf(cell);
            if (index > -1) {
              const mirrorIndex = (line.length - (index + 1));
              const mirrorCell=line[mirrorIndex];
              if (mirrorCell.value && ((mirrorCell.value + n) != (size + 1)))
                return false;
            }
          }
        }
      }

      // Sweeper cells

      // helper functions
      const getValidDigits = function(sweeperType)  {
        var digit;
        let validDigits = [];
        switch (sweeperType) {
          case 'E':
            digit = 2;
            while (digit <= size) {
              validDigits.push(digit);
              digit += 2;
            }
            break;
          case 'F':
            digit = 1;
            let digit2 = 2;
            while (digit  <=  size) {
              validDigits.push(digit);
              let temp = digit + digit2;
              digit = digit2;
              digit2 = temp;
            }
            break;
          case 'H':
            for (let digit=Math.ceil((size+1)/2);digit<=size;digit++) {
              validDigits.push(digit);
            }
            break;
          case 'L':
            for (let digit=1;digit<=Math.floor(size/2);digit++) {
              validDigits.push(digit);
            }
            break;
          case 'O':
            digit = 1;
            while (digit <= size) {
              validDigits.push(digit);
              digit += 2;
            }
            break;
          case 'P':
            // Since max size is 16, don't bother calculating primes, just hard code them
            let primes = [2,3,5,7,11,13];
            for (let loop=0;loop<primes.length;loop++)
              if (primes[loop] <= size) validDigits.push(primes[loop]);
            break;
          case 'S':
            for (let loop = 1; loop <= Math.sqrt(size); loop++)
              validDigits.push(loop * loop);
            break;
          case 'T':
            digit = 1;
            let addDigit = 2;
            while (digit <= size) {
              validDigits.push(digit);
              digit += addDigit;
              addDigit += 1;
            }
            break;
          case 'D':
            digit = 1;
            while (digit <= size) {
              validDigits.push(digit);
              digit *= 2;
            }
            break;
          default:
            return [];
        }

        return validDigits;
      }

      const isMatch = function(cell,validDigits) {
        if (cell.value && validDigits.includes(cell.value))
          return true;
        return false;
      }

      const isPossibleMatch = function(cell,validDigits) {
        if (cell.value && !validDigits.includes(cell.value))
          return false;
        return true;
      }

      const isInGrid = function(i,j) {
        if ((i < 0) || (i >= size)) return false;
        if ((j < 0) || (j >= size)) return false;
        return true;
      }

      const constraintsSCell = constraints[sweeperCellClass];
      if (constraintsSCell  && constraintsSCell.length > 0)  {
        for (let scell of constraintsSCell)  {
          if (scell && (scell.cell===cell) && scell.cell.value && scell.value) {
            let validDigits = getValidDigits(scell.value);
            // get the valid digits to be in surrounding cells
            // get number of possible matches in surrounding cells
            // count blank cells as possible. Pencilmarked cells, test pencil marks
            // and count as possible if at  least one  valid  digit found.
            var dX, dY, cellI, cellJ;
            let certainCount = 0;
            let possibleCount = 0
            for (dX = -1; dX < 2; dX++) {
              for (dY = -1; dY < 2; dY++) {
                cellI = scell.cell.i + dX;
                cellJ = scell.cell.j + dY;
                if (isInGrid(cellI,cellJ))  {
                  // JM edit
                  if (constraints[sweeperCellClass].negative) {
                    if (dX != 0 || dY != 0) {
                      if (isMatch(grid[cellI][cellJ],validDigits)) certainCount++;
                      if (isPossibleMatch(grid[cellI][cellJ],validDigits)) possibleCount++;
                    }
                  } else {
                    if (isMatch(grid[cellI][cellJ],validDigits)) certainCount++;
                    if (isPossibleMatch(grid[cellI][cellJ],validDigits)) possibleCount++;
                  }
                }
              }
            }
            // return false if there are too many certain matches or
            // not enough possible /matches
            if (certainCount  > scell.cell.value) return false;
            if (possibleCount < scell.cell.value) return false;
          }
        }
      }

      // Sum dot

      // helper functions

      const testSumDot  = function(sumDot,newCell,candidate,modal) {
        // If we don't have a value, then return true (cosmetic dot)
        if (!sumDot.value || sumDot.value.length===0 ) {
          return true;
        }

        let sum = candidate;

        // Process the cells
        for (let cell of sumDot.cells) {
          // if there is an empty cell in the group, return true
          if (!cell.value && (cell != newCell)) {
            return true;
          }
          // Get the sum of existing cells and candidate
          if (cell != newCell) { sum += cell.value; }

          // If modal, scale to grid size
          if (modal) {
            sum %= size;
            if (sum === 0) {sum = size;}
          }
        }

        // test the sum
        if (parseInt(sumDot.value) === sum) {
          return true;
        } else {
          return false;
        }

      }

      const constraintsSumDot = constraints[sumDotClass];
      if (constraintsSumDot && constraintsSumDot.length > 0) {
        // loop through all the sumDot's and identify which one we are testing
        for (let sumDot of constraintsSumDot) {
          if (sumDot.cells.indexOf(cell) != -1) {
            return testSumDot(sumDot,cell,n,constraints[sumDotClass].negative);
          }
        }
      }

      const constraintsCornerSumDot = constraints[cornerSumDotClass];
      if (constraintsCornerSumDot && constraintsCornerSumDot.length > 0) {
        // loop through all the sumDot's and identify which one we are testing
        for (let sumDot of constraintsCornerSumDot) {
          if (sumDot.cells.indexOf(cell) != -1) {
            return testSumDot(sumDot,cell,n,constraints[cornerSumDotClass].negative);
          }
        }
      }

      return true;
    }

    // Drawing helpers
    const drawLine = function(line, color, colorDark, lineWidth) {
      ctx.lineWidth = cellSL * lineWidth * 0.5;
      ctx.fillStyle = boolSettings['Dark Mode'] ? colorDark : color;
      ctx.strokeStyle = boolSettings['Dark Mode'] ? colorDark : color;
      ctx.beginPath();
      ctx.arc(line[0].x + cellSL / 2, line[0].y + cellSL / 2, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(line[0].x + cellSL / 2, line[0].y + cellSL / 2);
      for (var b = 1; b < line.length; b++) {
        ctx.lineTo(line[b].x + cellSL / 2, line[b].y + cellSL / 2);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(line[line.length - 1].x + cellSL / 2, line[line.length - 1].y + cellSL / 2, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const drawDottedLine = function(line, cells, color, colorDark, lineWidth) {
      const radius = cellSL * lineWidth * 0.25;

      drawLine(line, color, colorDark, lineWidth);

      // Draw dot
      if (cells.length > 0) {
        // calculate midpoint
        let centreX = 0;
        let centreY = 0;
        let halfWidth = cellSL * 0.5;
        for ( let cell of cells ) {
          centreX += cell.x + halfWidth;
          centreY += cell.y + halfWidth;
        }
        centreX /= cells.length;
        centreY /= cells.length;

        ctx.fillStyle = boolSettings['Dark Mode'] ? colorDark : color;
        ctx.strokeStyle = boolSettings['Dark Mode'] ? colorDark : color;
        ctx.beginPath();
        ctx.arc(centreX,centreY,radius,0,2*Math.PI,false);
        ctx.fill();
        ctx.stroke();
      }
    }

    const drawSweep = function(cell, color, colorDark, value, flagged) {
      let startX = cell.x + (cellSL*.075);
      let startY = cell.y + (cellSL*.075);
      ctx.lineWidth = lineWT;
      ctx.strokeStyle = boolSettings['Dark Mode'] ? colorDark : color;
      let background = "#FFFFFF00";
      if (flagged) {
        background = (boolSettings['Dark Mode'] ? colorDark : color).substring(0, 7) + '30';
      }
      ctx.fillStyle = background;
      ctx.strokeRect(startX, startY, cellSL*.85, cellSL*.85);
      ctx.fillRect(startX, startY, cellSL*.85, cellSL*.85);
      ctx.fillStyle = boolSettings['Dark Mode'] ? colorDark : color;
      ctx.font = (cellSL * 0.2) + 'px Verdana';
      ctx.textAlign = 'center';
      ctx.fillText(value, cell.x + (cellSL * 0.5), cell.y + (cellSL * 0.26));
      ctx.fillText(value, cell.x + (cellSL * 0.5), cell.y + (cellSL * 0.85));
      ctx.fillText(value, cell.x + (cellSL * 0.18), cell.y + (cellSL * 0.55));
      ctx.fillText(value, cell.x + (cellSL * 0.82), cell.y + (cellSL * 0.55));
    }

    // Constraint classes

    // Clock
    window[clockLineClass] = function(cell) {
      this.lines = [
        [cell]
      ];

      this.show = function() {
        const clockInfo = newConstraintInfo.filter(c => c.name === clockLineName)[0];
        for (var a = 0; a < this.lines.length; a++) {
          drawLine(this.lines[a], clockInfo.color, clockInfo.colorDark, clockInfo.lineWidth);
        }
      }

      this.addCellToLine = function(cell) {
        this.lines[this.lines.length - 1].push(cell);
      }
    }
    // Chinese Whisper
    window[chineseWhisperClass] = function(cell) {
      this.lines = [
        [cell]
      ];

      this.show = function() {
        const cWhispInfo =  newConstraintInfo.filter(c => c.name === chineseWhisperName)[0];
        for (var a = 0; a < this.lines.length; a++) {
          const line = this.lines[a];
          drawLine(line, cWhispInfo.color, cWhispInfo.colorDark, cWhispInfo.lineWidth);
        }
      }

      this.addCellToLine = function(cell) {
        this.lines[this.lines.length - 1].push(cell);
      }

    }
    // Weak Palindrome
    window[weakPalindromeClass] = function(cell) {
      this.lines = [
        [cell]
      ];

      this.show = function() {
        const wpalInfo = newConstraintInfo.filter(c => c.name === weakPalindromeName)[0];
        for (var a = 0; a < this.lines.length; a++) {
          const line = this.lines[a];
          let cells = [];
          if (line.length > 1) {
            cells.push(line[Math.floor((line.length-1)/2)]);
            if ((line.length%2)==0) {
              cells.push(line[Math.ceil((line.length-1)/2)])
            }
          }
          drawDottedLine(line, cells, wpalInfo.color, wpalInfo.colorDark, wpalInfo.lineWidth);
        }
      }

      this.addCellToLine = function(cell) {
        this.lines[this.lines.length - 1].push(cell);
      }
    }
    // AntiPalindrome
    window[antiPalindromeClass] = function(cell) {
      this.lines = [
        [cell]
      ];


      this.show = function() {
        const antiPalInfo = newConstraintInfo.filter(c => c.name === antiPalindromeName)[0];
        for (var a = 0; a < this.lines.length; a++) {
          const line = this.lines[a];
          let cells  = [];
          if (line.length > 1) {
            cells.push(line[Math.floor((line.length-1)/2)]);
            if ((line.length%2)==0) {
              cells.push(line[Math.ceil((line.length-1)/2)])
            }
            drawDottedLine(line, cells, antiPalInfo.color, antiPalInfo.colorDark, antiPalInfo.lineWidth);
          }
        }
      }

      this.addCellToLine = function(cell) {
        this.lines[this.lines.length - 1].push(cell);
      }

    }
    // Sweeper Cell
    window[sweeperCellClass] = function(cell) {
      if(cell) {
        this.cell = cell[0];
        this.value = '';
      }

      this.show = function() {
        const sCellInfo = newConstraintInfo.filter(c => c.name === sweeperCellName)[0];
        drawSweep(this.cell,sCellInfo.color,sCellInfo.colorDark,this.value,constraints[sweeperCellClass].negative);
      }

      this.typeNumber = function(num){
        let types = 'DEFHLOPST';
        if((parseInt(num) > 0)) {
          index = parseInt(num) - 1;
          this.value = types.substring(index,index+1);
        }
      }
    }

    // helper function
    const drawSumDot = function(sumDot,modal) {

      const sDotInfo = newConstraintInfo.filter(c => c.name === sumDotName)[0];
      const radius = cellSL * 0.175;
      ctx.save();
      ctx.lineWidth = lineWT;
      if (modal) {
        ctx.fillStyle = sDotInfo.modalcolor;
        ctx.strokeStyle = sDotInfo.modalcolor;
      } else {
        ctx.fillStyle = sDotInfo.color;
        ctx.strokeStyle = sDotInfo.color;
      }
      ctx.translate(sumDot.x(),sumDot.y());
      ctx.rotate(Math.PI/4);
      let side=cellSL * 0.35;
      ctx.fillRect(-side/2,-side/2,side,side);
      ctx.rotate(-Math.PI/4);
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0,0,radius,0,2*Math.PI,false);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#000000";
      ctx.textAlign = 'center';
      ctx.font = (cellSL * 0.8 * 0.35) + 'px Arial';
      ctx.fillText(sumDot.value ? sumDot.value : ' ', 0, cellSL * 0.3 * 0.35);
      ctx.restore();

    }

    // Sum dot
    window[sumDotClass] = function(cells) {
      if (cells) {
        this.cells = cells;
        this.value = '';
      }

      this.x = function(){
    		return this.cells.map(a => a.x + cellSL/2).reduce((a, b) => a + b) / this.cells.length;
    	}

    	this.y = function(){
    		return this.cells.map(a => a.y + cellSL/2).reduce((a, b) => a + b) / this.cells.length;
    	}

      this.show = function() {
        drawSumDot(this,constraints[sumDotClass].negative);
      }

      this.typeNumber = function(num) {
        this.value += num.toString(10);
      }

      this.sortCells = function(){
        this.cells.sort((a, b) => a.j - b.j);
        this.cells.sort((a, b) => a.i - b.i);
      }

    }

    // Corner Sum dot
    window[cornerSumDotClass] = function(cells) {
      if (cells) {
        this.cells = cells;
        this.value = '';
      }

      this.x = function(){
    		return this.cells.map(a => a.x + cellSL/2).reduce((a, b) => a + b) / this.cells.length;
    	}

    	this.y = function(){
    		return this.cells.map(a => a.y + cellSL/2).reduce((a, b) => a + b) / this.cells.length;
    	}

      this.show = function() {
        drawSumDot(this,constraints[cornerSumDotClass].negative);
      }

      this.typeNumber = function(num) {
        this.value += num.toString(10);
      }

      this.sortCells = function(){
        this.cells.sort((a, b) => a.j - b.j);
        this.cells.sort((a, b) => a.i - b.i);
      }

    }


    const origCategorizeTools = categorizeTools;
    categorizeTools = function() {
      origCategorizeTools();

      let toolLineIndex = toolConstraints.indexOf('Palindrome');
      for (let info of newLineConstraintInfo) {
        toolConstraints.splice(++toolLineIndex, 0, info.name);
        lineConstraints.push(info.name);
      }
      let toolCellIndex = toolConstraints.indexOf('Maximum');
      for (let info of newCellConstraintInfo) {
        toolConstraints.splice(++toolCellIndex, 0, info.name);
        perCellConstraints.push(info.name);
        if (info.typable) { typableConstraints.push(info.name); }
      }
      let toolDotIndex = toolConstraints.indexOf('Difference');
      for (let info of newDotConstraintInfo) {
        toolConstraints.splice(++toolDotIndex,0,info.name);
        if (info.border) { borderConstraints.push(info.name); }
        if (info.corner) { cornerConstraints.push(info.name); }
        if (info.typable) { typableConstraints.push(info.name); }
      }

      // Constraints with a flagged version must be pushed into negativableConstraints
      for (let constraint of newConstraintInfo) {
        if (constraint.flagged) {
          negativableConstraints.push(constraint.name);
          flaggableConstraints.push(cID(constraint.name));
        }
      }

      draggableConstraints = [...new Set([...lineConstraints, ...regionConstraints])];
      multicellConstraints = [...new Set([...lineConstraints, ...regionConstraints, ...borderConstraints, ...cornerConstraints])];
      betweenCellConstraints = [...borderConstraints, ...cornerConstraints];
      allConstraints = [...boolConstraints, ...toolConstraints];

      tools = [...toolConstraints, ...toolCosmetics];
      selectableTools = [...selectableConstraints, ...selectableCosmetics];
      lineTools = [...lineConstraints, ...lineCosmetics];
      regionTools = [...regionConstraints, ...regionCosmetics];
      diagonalRegionTools = [...diagonalRegionConstraints, ...diagonalRegionCosmetics];
      outsideTools = [...outsideConstraints, ...outsideCosmetics];
      outsideCornerTools = [...outsideCornerConstraints, ...outsideCornerCosmetics];
      oneCellAtATimeTools = [...perCellConstraints, ...draggableConstraints, ...draggableCosmetics];
      draggableTools = [...draggableConstraints, ...draggableCosmetics];
      multicellTools = [...multicellConstraints, ...multicellCosmetics];
    }

    // Tooltips
    for (let info of newConstraintInfo) {
      descriptions[info.name] = info.tooltip;
      // If a flagged version exists, add the tooltip
      if (info.flagged) {
        descriptions[info.name + '-'] = info.flagDescription;
      }
    }
  }

  if (window.grid) {
  doShim();
  } else {
    document.addEventListener('DOMContentLoaded', (event) => {
      doShim();
    });
  }
})();
