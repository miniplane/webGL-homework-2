function Object3D(shape, children) {
	this.shape = shape;
	this.posRotMatrix = mat4.create();
	this.sclMatrix = mat4.create();
	this.rotation = 0.0;
	this.spinspeedfactor = 1;

	if (children !== undefined)
		this.children = children;
	else
		this.children = [];

	this.update_function = function() {};

	mat4.identity(this.posRotMatrix);
	mat4.identity(this.sclMatrix);

	return this;
}

function spinnery() {
	mat4.rotate(this.posRotMatrix, degToRad(-0.010*elapsed*this.spinspeedfactor), [0, 1, 0]);
}

function spinnerx() {
	mat4.rotate(this.posRotMatrix, degToRad(-0.010*elapsed*this.spinspeedfactor), [1, 0, 0]);
}

var selected;
var scene;

function build_scene() {
	loadScene();

	var make_planet_on_a_stick = function(planetradius, distance, planettilt, planetchildren) { // (0.4, 3.5)
		var ch = [
			new Object3D(cylinder),
			new Object3D(sphere, planetchildren)
		];

		var sunradius = 1;

		var stickLength = distance - (sunradius + planetradius);
		var stickCenter = sunradius + stickLength / 2;

		mat4.translate(ch[0].posRotMatrix, [0, 0, stickCenter]);
		mat4.scale(ch[0].sclMatrix, [0.05, 0.05, stickLength/2]);

		mat4.translate(ch[1].posRotMatrix, [0, 0, distance]);
		mat4.rotate(ch[1].posRotMatrix, degToRad(planettilt), [1, 0, 0]);
		mat4.scale(ch[1].sclMatrix, [planetradius, planetradius, planetradius]);

		return new Object3D(null, ch);
	};

	scene = [
		new Object3D(null, [
			new Object3D(sphere),	//sun
			new Object3D(cylinder), // ground
			new Object3D(cylinder), // ground -> sun
			make_planet_on_a_stick(0.7, 3.5, 90, [
				make_planet_on_a_stick(0.5, 3.0, 0),
				make_planet_on_a_stick(0.6, 2.0, 90, [
					make_planet_on_a_stick(0.45, 2.5, 0)
				])
			]),
			make_planet_on_a_stick(0.4, 3.5, 80),
		])
	];

	scene[0].update_function = spinnery;

	// sun
	mat4.translate(scene[0].children[0].posRotMatrix, [0.0, 0.0, 0.0]);

	// ground
	mat4.translate(scene[0].posRotMatrix, [0.0, -1.0, -15.0]);
	mat4.translate(scene[0].children[1].posRotMatrix, [0.0, -3.0, 0.0]);
	mat4.rotate(scene[0].children[1].posRotMatrix, degToRad(90), [1, 0, 0]); // x clockwise
	mat4.scale(scene[0].children[1].sclMatrix, [2, 2, 0.1]);

	// ground -> sun
	mat4.translate(scene[0].children[2].posRotMatrix, [0.0, 1.1-3, 0.0]);
	mat4.rotate(scene[0].children[2].posRotMatrix, degToRad(90), [1, 0, 0]); // x clockwise
	mat4.scale(scene[0].children[2].sclMatrix, [0.05, 0.05, 1]);

	// second planet rotation
	mat4.rotate(scene[0].children[3].posRotMatrix, degToRad(160), [0, 1, 0]); // x clockwise

	// moon1
	scene[0].children[3].children[1].children[0].update_function = spinnery;
	scene[0].children[3].children[1].children[0].spinspeedfactor = 5;

	// moon2
	mat4.rotate(scene[0].children[3].children[1].children[1].posRotMatrix, degToRad(160), [0, 1, 0]);
	scene[0].children[3].children[1].children[1].update_function = spinnery;
	scene[0].children[3].children[1].children[1].spinspeedfactor = 3;

	//  734p07 547311i73
	var teapot_satellite = scene[0].children[3].children[1].children[1].children[1].children[0].children[1];
	teapot_satellite.shape = null; // have to go deeper
	teapot_satellite.children = [new Object3D(teapot)];
	mat4.translate(teapot_satellite.children[0].posRotMatrix, [0, -0.4, 0]);
	mat4.scale(teapot_satellite.sclMatrix, [1.8, 1.8, 1.8]);

	scene[0].children[3].children[1].children[1].children[1].children[0].update_function = spinnery;
	scene[0].children[3].children[1].children[1].children[1].children[0].spinspeedfactor = 5;

	teapot_satellite.update_function = spinnerx;
	teapot_satellite.spinspeedfactor = 30;

};

function draw_scene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.lineWidth(3);

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);

	var rootMatrix = mat4.create();
	mat4.identity(rootMatrix);

	for (var i in scene) {
		draw_scene_subtree(rootMatrix, scene[i]);
	}

	//scene.forEach(draw_scene_subtree);
}

function draw_scene_subtree(parentmatrix, object) {
	var localmatrix = mat4.create();
	mat4.set(parentmatrix, localmatrix);

	//mat4.rotate(object.posRotMatrix, degToRad(-10), [0, 0, 1]);
	object.update_function();

	mat4.multiply(localmatrix, object.posRotMatrix);
	mat4.multiply(localmatrix, object.sclMatrix);

	// send localmatrix to the shader
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, localmatrix);

	if (object.shape !== null)
		draw_object(object.shape);

	for (var i in object.children) {
		draw_scene_subtree(localmatrix, object.children[i]);
	}

	// draw_object(coordinate_system);
}


function draw_object(shape) {
	var vertexPositionBuffer = shape.positionBuffer;
	var vertexColorBuffer = shape.colorBuffer;
	var vertexIndexBuffer = shape.indexBuffer;

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
	gl.drawElements(shape.elementType, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}