/*
 * Script to draw a 2D smiley face, and apply trasnformations to it
 *
 * Gilberto Echeverria
 * 2026-07-16
 * 
 * Julian berges N 
 */

'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { diamond,  smiley } from './shapes.js';
import { V2, M3, type Vec2, type Mat3 } from './2d-lib.js';
import { Scene } from './scene.js';
import { type Color } from './color.js';

// Import the shaders from external files
import vsGLSL from './vs_matrices_vcolor.glsl?raw';
import fsGLSL from './fs_vertex_color.glsl?raw';



/*
 * Subclass of Scene with the particular objects and settings for this example.
 * Specifies the objects that will be used, and the UI operations available.
 */
class RotationScene extends Scene {
     settings = {
        order: 'Normal',
    };

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vsGLSL, fsGLSL);

        // Create the objects for this scene
        const model = this.addObject('model', smiley(100),
            [ Math.random(), Math.random(), Math.random(), 1 ]);
        model.transforms.t.x = gl.canvas.width / 2;
        model.transforms.t.y = gl.canvas.height / 2;

        const pivot = this.addObject('pivot', diamond(30),
            [ 0.6, 0.6, 0.6, 1]);
        pivot.transforms.t.x = gl.canvas.width / 2;
        pivot.transforms.t.y = gl.canvas.height / 2;
    }

    // Method to draw the scene.
    protected render(): void {
        const { gl, programInfo } = this;
        const model = this.getObject('model');
        const pivot = this.getObject('pivot');

        // Vector to the position of the model
        const v2_trans: Vec2 = V2.create(model.transforms.t.x, model.transforms.t.y);
        const v2_scale: Vec2 = V2.create(model.transforms.s.x, model.transforms.s.y);

        // Vector to translate the pivot to the center of the world
        const v2_pivot_to_center: Vec2 = V2.create(-pivot.transforms.t.x,
                                                   -pivot.transforms.t.y);
        // Vector to translate the pivot back to its original position
        const v2_center_to_pivot: Vec2 = V2.create(pivot.transforms.t.x,
                                                   pivot.transforms.t.y);

        // Transform matrices for the model
        
        // Create a composite transform matrix
       
        // TODO: Multiply the matrices in the correct order to obtain the required results
        // The multiplications were done in each case so the base multiplication is case 'Normal' 
        // TODO: Create the matrices necessary
            let translateMatrix = M3.translation(v2_trans);
            let rotateMatrix = M3.rotation(model.transforms.rr.z);
            let scaleMatrix = M3.scale(v2_scale);

            let pivot_to_center = M3.translation(v2_pivot_to_center);
            let center_to_pivot = M3.translation(v2_center_to_pivot);   
             
       
            let modelTransforms = M3.identity();

            switch (this.settings.order) {

            case 'Normal':

            modelTransforms = M3.multiply(scaleMatrix, modelTransforms); //scale

            modelTransforms = M3.multiply(translateMatrix, modelTransforms); //translation 

            modelTransforms = M3.multiply(pivot_to_center,modelTransforms) // pivot a center 

            modelTransforms = M3.multiply(rotateMatrix, modelTransforms); // rotation

            modelTransforms = M3.multiply(center_to_pivot,modelTransforms) // center a pivot

          
            break;

            case 'scale -> rotation -> translation':
                modelTransforms = M3.multiply(scaleMatrix, modelTransforms);

               
                modelTransforms = M3.multiply(pivot_to_center, modelTransforms);
                modelTransforms = M3.multiply(rotateMatrix, modelTransforms);
                modelTransforms = M3.multiply(center_to_pivot, modelTransforms);

                modelTransforms = M3.multiply(translateMatrix, modelTransforms);
                break;

            case 'scale -> translation -> rotation':
                modelTransforms = M3.multiply(scaleMatrix, modelTransforms);
                modelTransforms = M3.multiply(translateMatrix, modelTransforms);

                modelTransforms = M3.multiply(pivot_to_center, modelTransforms);
                modelTransforms = M3.multiply(rotateMatrix, modelTransforms);
                modelTransforms = M3.multiply(center_to_pivot, modelTransforms);
                break;

            case 'translation -> scale -> rotation':
                modelTransforms = M3.multiply(translateMatrix, modelTransforms);
                modelTransforms = M3.multiply(scaleMatrix, modelTransforms);

                modelTransforms = M3.multiply(pivot_to_center, modelTransforms);
                modelTransforms = M3.multiply(rotateMatrix, modelTransforms);
                modelTransforms = M3.multiply(center_to_pivot, modelTransforms);
                break;

            case 'rotation -> translation -> scale':
                modelTransforms = M3.multiply(pivot_to_center, modelTransforms);
                modelTransforms = M3.multiply(rotateMatrix, modelTransforms);
                modelTransforms = M3.multiply(center_to_pivot, modelTransforms);

                modelTransforms = M3.multiply(translateMatrix, modelTransforms);
                modelTransforms = M3.multiply(scaleMatrix, modelTransforms);
                break;

            case 'rotation -> scale -> translation':
                modelTransforms = M3.multiply(pivot_to_center, modelTransforms);
                modelTransforms = M3.multiply(rotateMatrix, modelTransforms);
                modelTransforms = M3.multiply(center_to_pivot, modelTransforms);

                modelTransforms = M3.multiply(scaleMatrix, modelTransforms);
                modelTransforms = M3.multiply(translateMatrix, modelTransforms);
                break;
        }



            // transforms = M3.multiply(center_to_pivot,transforms) // center to pivot 
            // transforms = M3.multiply(pivot_to_center,transforms) // pivot a center 



        gl.useProgram(programInfo.program);

        let uniforms = {
            u_resolution: [gl.canvas.width, gl.canvas.height],
            u_transforms: modelTransforms,
            u_color: model.color,
        };
        twgl.setUniforms(programInfo, uniforms);
        gl.bindVertexArray(model.vao);
        twgl.drawBufferInfo(gl, model.bufferInfo);

        // Transform matrices for the pivot
        const translateMatrixPivot: Mat3 = M3.translation(v2_center_to_pivot);

        // Composite transform matrix for the pivot (only translation)
        let pivotTransforms: Mat3 = M3.identity();
        pivotTransforms = M3.multiply(translateMatrixPivot, pivotTransforms);

        uniforms = {
            u_resolution: [gl.canvas.width, gl.canvas.height],
            u_transforms: pivotTransforms,
            u_color: pivot.color,
        };
        twgl.setUniforms(programInfo, uniforms);
        gl.bindVertexArray(pivot.vao);
        twgl.drawBufferInfo(gl, pivot.bufferInfo);
    }

    setupUI(): void {
        const { gl } = this;
        const model = this.getObject('model');
        const pivot = this.getObject('pivot');

        const gui = new GUI();

        const modelFolder = gui.addFolder('Model');

        gui.add(this.settings, 'order', [ // The dropdown menu for the different options of transformation order
            'Normal',
            'scale -> rotation -> translation',
            'scale -> translation -> rotation',
            'translation -> scale -> rotation',
            'rotation -> translation -> scale',
            'rotation -> scale -> translation',
        ]).name('Transform order');


        const traFolder = modelFolder.addFolder('Translation');
        traFolder.add(model.transforms.t, 'x', 0, gl.canvas.width)
            .onChange((value: number) => {
                model.transforms.t.x = value;
            });
        traFolder.add(model.transforms.t, 'y', 0, gl.canvas.height)
            .onChange((value: number) => {
                model.transforms.t.y = value;
            });

        const rotFolder = modelFolder.addFolder('Rotation');
        rotFolder.add(model.transforms.rr, 'z', 0, Math.PI * 2)
            .onChange((value: number) => {
                model.transforms.rr.z = value;
            });

        const scaFolder = modelFolder.addFolder('Scale');
        scaFolder.add(model.transforms.s, 'x', -5, 5)
            .onChange((value: number) => {
                model.transforms.s.x = value;
            });
        scaFolder.add(model.transforms.s, 'y', -5, 5)
            .onChange((value: number) => {
                model.transforms.s.y = value;
            });

        const colorFolder = modelFolder.addFolder('Color');
        colorFolder.addColor(model, 'color')
            .onChange((value: Color) => {
                model.color = value;
            });

        const pivotFolder = gui.addFolder('Pivot');
        const pivotTraFolder = pivotFolder.addFolder('Translation');
        pivotTraFolder.add(pivot.transforms.t, 'x', 0, gl.canvas.width)
            .onChange((value: number) => {
                pivot.transforms.t.x = value;
            });
        pivotTraFolder.add(pivot.transforms.t, 'y', 0, gl.canvas.height)
            .onChange((value: number) => {
                pivot.transforms.t.y = value;
            });
    }
}

/*
 * Main function to initialize the WebGL context, create the scene, and set up the UI.
 */
function main(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    const scene = new RotationScene(gl);
    scene.setupUI();
    scene.draw(0);
}

main()
