// ==UserScript==
// @name         FPuzzles-multi-column-constraints
// @namespace    http://tampermonkey.net/
// @version      1.01
// @description  Implement a multi-column constraints selection box in f-puzzles
// @author       Kittiaara
// @match        https://*.f-puzzles.com/*
// @match        https://f-puzzles.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Your code here...

	const maxRowCount = 18;

    const doShim = function() {

        createSidebarConstraints = function(){


            var x = gridX - (sidebarDist + sidebarW/2);
            var y = gridY;
            var width = sidebarW;

            const sb = new sidebar(x, ['Setting']);
            sidebars.push(sb);
            sidebars[sidebars.length - 1].title = 'Constraints';

            y += buttonMargin;
            sb.buttons.push(new button(x, y, buttonW, buttonLH, ['Setting'], 'Info', 'Info'));
            y += buttonLH + buttonGap;
            sb.buttons.push(new button(x, y, buttonW, buttonLH, ['Setting'], 'Settings', 'Settings'));

            y += buttonLH + buttonMargin;
            sb.sections.push(new section(x, y));

            y += buttonMargin;
            sb.buttons.push(new button(x, y, buttonW, buttonLH, ['Setting'], 'New', 'New Grid'));
            y += buttonLH + buttonGap;
            sb.buttons.push(new button(x, y, buttonW, buttonLH, ['Setting'], 'Export', 'Export'));

            y += buttonLH + buttonMargin;
            sb.sections.push(new section(x, y, 'Constraints'));

            y += sidebarTitleHeight + buttonMargin;
            for(var a = 0; a < boolConstraints.length; a++){
                sb.buttons.push(new button(x - (buttonSH + buttonGap)/2, y, buttonW - (buttonSH + buttonGap), buttonSH, ['Setting'], boolConstraints[a], boolConstraints[a]));
                if(a < boolConstraints.length - 1)
                    y += buttonSH + buttonGap;
            }

            y += buttonSH + buttonMargin;
            sb.sections.push(new section(x, y));

            y += buttonMargin - buttonSH - buttonGap;
            for(var a = 0; a < selectableConstraints.length; a++){
                y += buttonSH + buttonGap;
                sb.buttons.push(new button(x, y, buttonW, buttonSH, ['Setting'], selectableConstraints[a], selectableConstraints[a]));
            }

            y += buttonSH + buttonGap;
            sb.buttons.push(new button(x, y, buttonW, buttonSH, ['Setting'], 'ConstraintTools', 'Constraint Tools', true, true));
            y += buttonSH + buttonGap;
            sb.buttons.push(new button(x, y, buttonW, buttonSH, ['Setting'], 'CosmeticTools', 'Cosmetic Tools', true, true));

            const originY = gridY + gridSL - ((buttonSH * (toolConstraints.length < maxRowCount ? toolConstraints.length : maxRowCount)) + (buttonGap * (toolConstraints.length < maxRowCount ? toolConstraints.length - 1 : maxRowCount-1)) + buttonMargin);
            const originX = x + sidebarW;
            let currentY = originY;
            let currentX = originX;
            for(var a = 0; a < toolConstraints.length; a++){
                if ((a % (maxRowCount+1)) == maxRowCount)  {
                    currentY = originY;
                    currentX += buttonW + (2 * (buttonSH + 2 * buttonGap));
                }
                sb.buttons.push(new button(currentX, currentY, buttonW, buttonSH, ['Constraint Tools'], toolConstraints[a], toolConstraints[a]));
                if(negativableConstraints.includes(toolConstraints[a]))
                    sb.buttons.push(new button(currentX + buttonW/2 + buttonGap + buttonSH/2, currentY, buttonSH, buttonSH, ['Constraint Tools'], toolConstraints[a] + '-', '-'));
                currentY += (buttonSH + buttonGap);
            }

            for(var a = 0; a < toolCosmetics.length; a++){
                const currentY = gridY + gridSL - ((buttonSH * toolCosmetics.length) + (buttonGap * (toolCosmetics.length - 1)) + buttonMargin) + ((buttonSH + buttonGap) * a);
                sb.buttons.push(new button(x + sidebarW, currentY, buttonW, buttonSH, ['Cosmetic Tools'], toolCosmetics[a], toolCosmetics[a]));
            }

            sb.buttons.push(new button(gridX - sidebarDist + sidebarW * 1.5,       0, 270, buttonSH, ['Cosmetic Tools'], 'CosmeticPlaceMode', ''));
            sb.buttons.push(new button(gridX - sidebarDist + sidebarW * 1.5 - 110, 0, 50,  buttonSH, ['Cosmetic Tools'], 'CosmeticSizeL', '<'));
            sb.buttons.push(new button(gridX - sidebarDist + sidebarW * 1.5 + 110, 0, 50,  buttonSH, ['Cosmetic Tools'], 'CosmeticSizeR', '>'));
            sb.buttons.push(new button(gridX - sidebarDist + sidebarW * 1.5 - 110, 0, 50,  buttonSH, ['Cosmetic Tools'], 'CosmeticWL', '<'));
            sb.buttons.push(new button(gridX - sidebarDist + sidebarW * 1.5 + 110, 0, 50,  buttonSH, ['Cosmetic Tools'], 'CosmeticWR', '>'));
            sb.buttons.push(new button(gridX - sidebarDist + sidebarW * 1.5 - 110, 0, 50,  buttonSH, ['Cosmetic Tools'], 'CosmeticHL', '<'));
            sb.buttons.push(new button(gridX - sidebarDist + sidebarW * 1.5 + 110, 0, 50,  buttonSH, ['Cosmetic Tools'], 'CosmeticHR', '>'));
            sb.buttons.push(new button(gridX - sidebarDist + sidebarW * 1.5 - 110, 0, 50,  buttonSH, ['Cosmetic Tools'], 'CosmeticAngleL', '<'));
            sb.buttons.push(new button(gridX - sidebarDist + sidebarW * 1.5 + 110, 0, 50,  buttonSH, ['Cosmetic Tools'], 'CosmeticAngleR', '>'));
        }
    }


    drawPopups = function(overlapSidebars){
        var box = null;
        if(overlapSidebars && popup && popups[cID(popup)]){
            box = popups[cID(popup)];

            ctx.lineWidth = lineWW;
            ctx.fillStyle = boolSettings['Dark Mode'] ? '#505050' : '#F0F0F0';
            ctx.strokeStyle = '#000000';
            ctx.fillRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, box.h);
            ctx.strokeRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, box.h);
        }



        if(overlapSidebars){
            if(popup === 'Info'){
                ctx.lineWidth = lineWW;
                ctx.fillStyle = boolSettings['Dark Mode'] ? '#404040' : '#E0E0E0';
                ctx.strokeStyle = '#000000';
                ctx.fillRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 90);
                ctx.strokeRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 90);

                ctx.fillStyle = boolSettings['Dark Mode'] ? '#F0F0F0' : '#000000';
                ctx.font = '50px Arial';
                ctx.fillText('Welcome to f-puzzles.com!', canvas.width/2, canvas.height/2 - box.h/2 + 64);

                ctx.font = '38px Arial';
                ctx.fillText('Here, you can create and solve', canvas.width/2, canvas.height/2 - box.h/2 + 140);
                ctx.fillText('all sorts of Sudoku variants!',  canvas.width/2, canvas.height/2 - box.h/2 + 180);

                ctx.font = 'bold 28px Arial';
                ctx.fillText('Shortcuts:', canvas.width/2, canvas.height/2 - box.h/2 + 230);
                ctx.font = '20px Arial';
                ctx.fillText('z - Select "Normal" enter mode',        canvas.width/2, canvas.height/2 - box.h/2 + 260);
                ctx.fillText('x - Select "Center" enter mode',        canvas.width/2, canvas.height/2 - box.h/2 + 280);
                ctx.fillText('c - Select "Corner" enter mode',        canvas.width/2, canvas.height/2 - box.h/2 + 300);
                ctx.fillText('v - Select "Highlight" enter mode',     canvas.width/2, canvas.height/2 - box.h/2 + 320);
                ctx.fillText('ctrl+z - Undo',                         canvas.width/2, canvas.height/2 - box.h/2 + 340);
                ctx.fillText('ctrl+y - Redo',                         canvas.width/2, canvas.height/2 - box.h/2 + 360);
                ctx.fillText('ctrl+a - Select all cells',             canvas.width/2, canvas.height/2 - box.h/2 + 380);
                ctx.fillText('ctrl+g - Switch to/from "Given Digit"', canvas.width/2, canvas.height/2 - box.h/2 + 400);
                ctx.fillText('space - Pause/unpause when solving',    canvas.width/2, canvas.height/2 - box.h/2 + 420);
            }


            if(popup === 'Change Log'){
                ctx.lineWidth = lineWW;
                ctx.fillStyle = boolSettings['Dark Mode'] ? '#404040' : '#E0E0E0';
                ctx.strokeStyle = '#000000';
                ctx.fillRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 90);
                ctx.strokeRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 90);

                ctx.fillStyle = boolSettings['Dark Mode'] ? '#F0F0F0' : '#000000';
                ctx.font = '50px Arial';
                ctx.fillText('Change Log', canvas.width/2, canvas.height/2 - box.h/2 + 64);
            }


            if(popup === 'Settings'){
                ctx.lineWidth = lineWW;
                ctx.fillStyle = boolSettings['Dark Mode'] ? '#404040' : '#E0E0E0';
                ctx.strokeStyle = '#000000';
                ctx.fillRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 90);
                ctx.strokeRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 90);

                ctx.fillStyle = boolSettings['Dark Mode'] ? '#F0F0F0' : '#000000';
                ctx.font = '60px Arial';
                ctx.fillText('Settings', canvas.width/2, canvas.height/2 - box.h/2 + 66);

                ctx.fillStyle = boolSettings['Dark Mode'] ? '#F0F0F0' : '#000000';
                ctx.font = 'bold 20px Arial';
                ctx.fillText('Brute Force Time Limit: ' + bruteForceTimeLimit + 's',       canvas.width/2, canvas.height/2 - box.h/2 + 454);
                ctx.fillText('Solution Count Limit: ' + solutionCountLimit,                canvas.width/2, canvas.height/2 - box.h/2 + 522);
                ctx.fillText('Solution Path Step Delay: ' + minStepDelay.toFixed(3) + 's', canvas.width/2, canvas.height/2 - box.h/2 + 590);
            }


            if(popup === 'New Grid'){
                ctx.lineWidth = lineWW;
                ctx.fillStyle = boolSettings['Dark Mode'] ? '#404040' : '#E0E0E0';
                ctx.strokeStyle = '#000000';
                ctx.fillRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 87.5);
                ctx.strokeRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 87.5);

                ctx.fillStyle = boolSettings['Dark Mode'] ? '#F0F0F0' : '#000000';
                ctx.font = '55px Arial';
                ctx.fillText('Select a grid size:', canvas.width/2, canvas.height/2 - box.h/2 + 62.5);

                ctx.font = '60px Arial';
                ctx.fillText(tempSize + 'x' + tempSize, canvas.width/2, canvas.height/2 + (box.h * 0.123));
            }


            if(popup === 'Export'){
                ctx.lineWidth = lineWW;
                ctx.fillStyle = boolSettings['Dark Mode'] ? '#404040' : '#E0E0E0';
                ctx.strokeStyle = '#000000';
                ctx.fillRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 100);
                ctx.strokeRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 100);

                ctx.fillStyle = boolSettings['Dark Mode'] ? '#F0F0F0' : '#000000';
                ctx.font = '60px Arial';
                ctx.fillText('Export Puzzle', canvas.width/2, canvas.height/2 - box.h/2 + 70);

                ctx.font = '30px Arial';
                ctx.fillText('Preview Mode', canvas.width/2 - 175, canvas.height/2 - box.h/2 + 145);
                ctx.font = '25px Arial';
                ctx.fillText('Image',        canvas.width/2 - 270, canvas.height/2 - box.h/2 + 185);
                ctx.fillText('SS/Link',      canvas.width/2 - 77,  canvas.height/2 - box.h/2 + 185);

                ctx.font = '30px Arial';
                ctx.fillText('Preview', canvas.width/2 + 230, canvas.height/2 - box.h/2 + 145);

                togglePreview(document.getElementById('previewType').checked);

                ctx.save();
                ctx.translate(canvas.width/2 - gridX + 330, canvas.height/2 - gridY - 20);
                ctx.scale(0.4, 0.4);
                drawGrid();
                ctx.restore();

                togglePreview(document.getElementById('previewType').checked);
            }


            if(popup === 'Edit Info'){
                ctx.lineWidth = lineWW;
                ctx.fillStyle = boolSettings['Dark Mode'] ? '#404040' : '#E0E0E0';
                ctx.strokeStyle = '#000000';
                ctx.fillRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 100);
                ctx.strokeRect(canvas.width/2 - box.w/2, canvas.height/2 - box.h/2, box.w, 100);

                ctx.fillStyle = boolSettings['Dark Mode'] ? '#F0F0F0' : '#000000';
                ctx.font = '60px Arial';
                ctx.fillText('Edit Puzzle Information', canvas.width/2, canvas.height/2 - box.h/2 + 70);

                ctx.font = '30px Arial';
                ctx.fillText('by', canvas.width/2, canvas.height/2 - box.h/2 + 215);
            }
        } else {
            if(popup === 'Constraint Tools'){
                ctx.lineWidth = lineWW;
                ctx.fillStyle = boolSettings['Dark Mode'] ? '#404040' : '#D0D0D0';
                ctx.strokeStyle = boolSettings['Dark Mode'] ? '#202020' : '#808080';
                let rowCount = toolConstraints.length > maxRowCount ? maxRowCount : toolConstraints.length;
                let sidebarHeight = 0 - (rowCount * (buttonSH + buttonGap)) + buttonGap - (buttonMargin * 2);
                let columnCount = Math.ceil(toolConstraints.length / maxRowCount);
                let sidebarWidth = columnCount * (sidebarW + (buttonGap + buttonSH) * 2);
                ctx.fillRect(gridX - sidebarDist, gridY + gridSL, sidebarWidth, sidebarHeight);
                ctx.strokeRect(gridX - sidebarDist, gridY + gridSL, sidebarWidth, sidebarHeight);
            }


            if(popup === 'Cosmetic Tools'){
                if([document.getElementById('baseC'), document.getElementById('outlineC'), document.getElementById('fontC')].includes(document.activeElement)){
                    document.getElementById('colorPicker').style.display = 'block';
                    if(/^#[0-9A-F]{6}$/i.test(document.activeElement.value))
                        cPicker.color.hexString = document.activeElement.value;
                } else document.getElementById('colorPicker').style.display = 'none';


                ctx.lineWidth = lineWW;
                ctx.fillStyle = boolSettings['Dark Mode'] ? '#404040' : '#D0D0D0';
                ctx.strokeStyle = boolSettings['Dark Mode'] ? '#202020' : '#808080';
                ctx.fillRect(gridX - sidebarDist, gridY + gridSL, sidebarW, -((buttonSH * toolCosmetics.length) + (buttonGap * (toolCosmetics.length - 1)) + (buttonMargin * 2)));
                ctx.strokeRect(gridX - sidebarDist, gridY + gridSL, sidebarW, -((buttonSH * toolCosmetics.length) + (buttonGap * (toolCosmetics.length - 1)) + (buttonMargin * 2)));
                if(toolCosmetics.includes(currentTool)){
                    ctx.fillRect(gridX - sidebarDist + sidebarW, cosmeticEditMenuY, sidebarW, cosmeticEditMenuH);
                    ctx.strokeRect(gridX - sidebarDist + sidebarW, cosmeticEditMenuY, sidebarW, cosmeticEditMenuH);
                    if(document.getElementById('colorPicker').style.display === 'block'){
                        ctx.fillRect(gridX - sidebarDist + sidebarW * 2, cosmeticEditMenuY + cosmeticEditMenuH - cPickerH, 175, cPickerH);
                        ctx.strokeRect(gridX - sidebarDist + sidebarW * 2, cosmeticEditMenuY + cosmeticEditMenuH - cPickerH, 175, cPickerH);
                    }
                }

                const btns = sidebars[0].buttons;
                const btnsToMove = ['CosmeticPlaceMode', 'CosmeticSizeL', 'CosmeticSizeR', 'CosmeticWL', 'CosmeticWR', 'CosmeticHL', 'CosmeticHR', 'CosmeticAngleL', 'CosmeticAngleR'];
                for(var a = 0; a < btnsToMove.length; a++)
                    btns[btns.findIndex(b => b.id === btnsToMove[a])].y = -1000;
                document.getElementById('baseC').style.display = 'none';
                document.getElementById('outlineC').style.display = 'none';
                document.getElementById('fontC').style.display = 'none';

                if(toolCosmetics.includes(currentTool)){
                    const sampleObj = new window[cID(currentTool)]([]);
                    var y = cosmeticEditMenuY + buttonMargin - buttonSH - buttonGap;
                    cPicker.resize(canvas.clientWidth * 0.1);
                    document.getElementById('colorPicker').style.top = (100 * ((cosmeticEditMenuY + cosmeticEditMenuH - cPickerH) / canvas.height) + 1) + '%';
                    setTimeout(function(){
                        cPicker.setOptions({margin: canvas.clientWidth * 0.001, borderWidth: canvas.clientWidth * 0.004});
                    }, 1);

                    ctx.fillStyle = boolSettings['Dark Mode'] ? '#F0F0F0' : '#000000';
                    ctx.font = 'bold 24px Arial';
                    if(undraggableCosmetics.includes(currentTool)){
                        y += buttonSH + buttonGap;
                        btns[btns.findIndex(a => a.id === 'CosmeticPlaceMode')].y = y;
                        y += 15;
                    }
                    if(sampleObj.size !== undefined){
                        y += buttonSH + buttonGap;
                        btns[btns.findIndex(a => a.id === 'CosmeticSizeL')].y = y;
                        btns[btns.findIndex(a => a.id === 'CosmeticSizeR')].y = y;
                        ctx.fillText('Size: ' + cosmetics[cID(currentTool)].size.toFixed(2), gridX - sidebarDist + sidebarW * 1.5, y + buttonSH * 0.8);
                    }
                    if(sampleObj.width !== undefined){
                        y += buttonSH + buttonGap;
                        btns[btns.findIndex(a => a.id === 'CosmeticWL')].y = y;
                        btns[btns.findIndex(a => a.id === 'CosmeticWR')].y = y;
                        ctx.fillText('Width: ' + cosmetics[cID(currentTool)].width.toFixed(2), gridX - sidebarDist + sidebarW * 1.5, y + buttonSH * 0.8);
                    }
                    if(sampleObj.height !== undefined){
                        y += buttonSH + buttonGap;
                        btns[btns.findIndex(a => a.id === 'CosmeticHL')].y = y;
                        btns[btns.findIndex(a => a.id === 'CosmeticHR')].y = y;
                        ctx.fillText('Height: ' + cosmetics[cID(currentTool)].height.toFixed(2), gridX - sidebarDist + sidebarW * 1.5, y + buttonSH * 0.8);
                    }
                    if(sampleObj.angle !== undefined){
                        y += buttonSH + buttonGap;
                        btns[btns.findIndex(a => a.id === 'CosmeticAngleL')].y = y;
                        btns[btns.findIndex(a => a.id === 'CosmeticAngleR')].y = y;
                        ctx.fillText('Angle: ' + cosmetics[cID(currentTool)].angle + '°', gridX - sidebarDist + sidebarW * 1.5, y + buttonSH * 0.8);
                    }

                    ctx.fillStyle = boolSettings['Dark Mode'] ? '#F0F0F0' : '#000000';
                    ctx.font = 'bold 16px Arial';
                    if(sampleObj.baseC){
                        y += buttonSH + cosmeticEditMenuCBoxGap;
                        ctx.fillText('Base', gridX - sidebarDist + sidebarW * 1.5, y - buttonSH * 0.2);
                        document.getElementById('baseC').style.top = (100 * (y / canvas.height) - 0.3) + '%';
                        document.getElementById('baseC').style.display = 'block';
                    }
                    if(sampleObj.outlineC){
                        y += buttonSH + cosmeticEditMenuCBoxGap;
                        ctx.fillText('Outline', gridX - sidebarDist + sidebarW * 1.5, y - buttonSH * 0.2);
                        document.getElementById('outlineC').style.top = (100 * (y / canvas.height) - 0.3) + '%';
                        document.getElementById('outlineC').style.display = 'block';
                    }
                    if(sampleObj.fontC){
                        y += buttonSH + cosmeticEditMenuCBoxGap;
                        ctx.fillText('Text', gridX - sidebarDist + sidebarW * 1.5, y - buttonSH * 0.2);
                        document.getElementById('fontC').style.top = (100 * (y / canvas.height) - 0.3) + '%';
                        document.getElementById('fontC').style.display = 'block';
                    }
                }
            }
        }
    }

    document.onmousemove = function(mouse){
        updateCursorPosition(mouse);

        if(!testPaused() && !disableInputs){
            if(holding){
                if(mode === 'Solving' || selectableConstraints.includes(currentTool)){
                    for(var i = 0; i < size; i++){
                        for(var j = 0; j < size; j++){
                            if(grid[i][j].hovering())
                                grid[i][j].select();
                        }
                    }
                }

                if(mode === 'Setting')
                    useDraggableTools();
            }

            if(sidebars.length){
                var hoveredButton = sidebars[sidebars.findIndex(a => a.title === 'Constraints')].buttons[sidebars[sidebars.findIndex(a => a.title === 'Constraints')].buttons.findIndex(a => a.id === 'ConstraintTools')];
                if(popup === 'Constraint Tools') {
					let rowCount = toolConstraints.length > maxRowCount ? maxRowCount+1 : toolConstraints.length+1;
					let sidebarHeight = (rowCount * (buttonSH + buttonGap)) + buttonGap - (buttonMargin * 2);
					let columnCount = Math.ceil(toolConstraints.length / maxRowCount);
					let sidebarWidth = columnCount * (sidebarW + (buttonGap + buttonSH) * 2);
					if	(popup === 'Constraint Tools' && (mouseX < hoveredButton.x - hoveredButton.w/2 - buttonMargin || mouseX > hoveredButton.x + hoveredButton.w/2 + buttonMargin || mouseY < hoveredButton.y - buttonMargin || mouseY > hoveredButton.y + buttonSH + buttonMargin) && (mouseX < gridX - sidebarDist || mouseX > gridX - sidebarDist + sidebarWidth || mouseY < gridY + gridSL - sidebarHeight || mouseY > gridY + gridSL)) {
						closePopups();
					}
				}
                var hoveredButton = sidebars[sidebars.findIndex(a => a.title === 'Constraints')].buttons[sidebars[sidebars.findIndex(a => a.title === 'Constraints')].buttons.findIndex(a => a.id === 'CosmeticTools')];
                if(popup === 'Cosmetic Tools' && (mouseX < hoveredButton.x - hoveredButton.w/2 - buttonMargin || mouseX > hoveredButton.x + hoveredButton.w/2 + buttonMargin || mouseY < hoveredButton.y - buttonMargin || mouseY > hoveredButton.y + buttonSH + buttonMargin) &&
                   (mouseX < gridX - sidebarDist || mouseX > gridX - sidebarDist + sidebarW || mouseY < gridY + gridSL - ((buttonSH * toolCosmetics.length) + (buttonGap * (toolCosmetics.length - 1)) + (buttonMargin * 2)) || mouseY > gridY + gridSL) &&
                   (!toolCosmetics.includes(currentTool) || (mouseX < gridX - sidebarDist + sidebarW || mouseX > gridX - sidebarDist + sidebarW * 2 || mouseY < cosmeticEditMenuY || mouseY > cosmeticEditMenuY + cosmeticEditMenuH)) &&
                   (document.getElementById('colorPicker').style.display === 'none' || (mouseX < gridX - sidebarDist + sidebarW * 2 - cosmeticEditMenuCloseForgiveness || mouseX > gridX - sidebarDist + sidebarW * 2 + 175 + cosmeticEditMenuCloseForgiveness || mouseY < cosmeticEditMenuY + cosmeticEditMenuH - cPickerH - cosmeticEditMenuCloseForgiveness || mouseY > cosmeticEditMenuY + cosmeticEditMenuH + cosmeticEditMenuCloseForgiveness)))
                    closePopups();
            }

            for(var a = 0; a < sidebars.length; a++){
                for(var b = 0; b < sidebars[a].buttons.length; b++){
                    if(sidebars[a].buttons[b].hoverable && sidebars[a].buttons[b].click())
                        return onInputEnd();
                }
            }

            for(var a = 0; a < buttons.length; a++){
                if(buttons[a].hoverable && buttons[a].click())
                    return onInputEnd();
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
