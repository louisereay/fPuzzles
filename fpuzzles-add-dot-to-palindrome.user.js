// ==UserScript==
// @name         Fpuzzles-add-dot-to-palindrome
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Modifies the inbuilt palindrome line to have a dot marking the midpoint
// @author       Kittiaara
// @match        https://*.f-puzzles.com/*
// @match        https://f-puzzles.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const updateConstraint = function() {

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

        ctx.beginPath();
        ctx.arc(centreX,centreY,radius,0,2*Math.PI,false);
        ctx.fill();
        ctx.stroke();
      }
    }

    window.palindrome = function(cell){
        this.lines = [[cell]];

        this.considered = false;

        this.show = function(){
            for(var a = 0; a < this.lines.length; a++){
                const line = this.lines[a];
                let cells = [];
                if (line.length > 1) {
                    // draw a dot at the midpoint of the line
                    cells.push(line[Math.floor((line.length-1)/2)]);
                    if ((line.length%2)==0) {
                        cells.push(line[Math.ceil((line.length-1)/2)])
                    }
                }
                drawDottedLine(line, cells, '#C0C0C0', '#606060', 0.5);
            }
        }

        this.addCellToLine = function(cell){
            this.lines[this.lines.length - 1].push(cell);
        }
    }

  }

  if (window.grid) {
    updateConstraint();
  } else {
    document.addEventListener('DOMContentLoaded', (event) => {
      updateConstraint();
    });
  }
})();
