function Object3D(shape, children) {
	this.shape = shape;
	this.posRotMatrix = mat4.create();
	this.sclMatrix = mat4.create();
	this.rotation = 0.0;

	if (children !== undefined)
		this.children = children;
	else
		this.children = [];

	this.updateFunc = function() {};

	mat4.identity(this.posRotMatrix);
	mat4.identity(this.sclMatrix);

	return this;
}

function spinner() {
	mat4.rotate(this.posRotMatrix, degToRad(-0.010*elapsed), [0, 1, 0]);
}

var selected;
var scene;

function build_scene() {
	loadScene();
	scene = [
		new Object3D(null, [
			new Object3D(sphere),	//sun
			new Object3D(cylinder), // ground
			new Object3D(cylinder), // ground -> sun
			new Object3D(cylinder), // sun - > planet1
			new Object3D(cylinder), // sun - > planet2
			new Object3D(null, [
				new Object3D(sphere) // planet1
			]),
			new Object3D(null, [
				new Object3D(sphere) // planet2
			])
		])

		//new Object3D(cylinder),
		//new Object3D(bunny),
		//new Object3D(teapot)
	];

	scene[0].updateFunc = spinner;

	// sun
	mat4.translate(scene[0].children[0].posRotMatrix, [0.0, 3.0, 0.0]);

	// ground
	mat4.translate(scene[0].posRotMatrix, [0.0, -4.0, -15.0]);
	mat4.rotate(scene[0].children[1].posRotMatrix, degToRad(90), [1, 0, 0]); // x clockwise
	mat4.scale(scene[0].children[1].sclMatrix, [2, 2, 0.1]);

	// ground -> sun
	mat4.translate(scene[0].children[2].posRotMatrix, [0.0, 1.1, 0.0]);
	mat4.rotate(scene[0].children[2].posRotMatrix, degToRad(90), [1, 0, 0]); // x clockwise
	mat4.scale(scene[0].children[2].sclMatrix, [0.05, 0.05, 1]);

	// sun -> planet1
	mat4.translate(scene[0].children[4].posRotMatrix, [0.0, 3, 1.3]);
	mat4.scale(scene[0].children[4].sclMatrix, [0.05, 0.05, 2]);


	// planet1
	mat4.translate(scene[0].children[5].children[0].posRotMatrix, [0.0, 3, 3.5]);
	mat4.scale(scene[0].children[5].children[0].sclMatrix, [0.4, 0.4, 0.4]);

	// sun - > planet2
	mat4.rotate(scene[0].children[3].posRotMatrix, degToRad(160), [0, 1, 0]); // x clockwise
	mat4.translate(scene[0].children[3].posRotMatrix, [0.0, 3, 1.5]);
	mat4.scale(scene[0].children[3].sclMatrix, [0.05, 0.05, 2.3]);

	// planet2
	mat4.rotate(scene[0].children[6].children[0].posRotMatrix, degToRad(160), [0, 1, 0]);
	mat4.translate(scene[0].children[6].children[0].posRotMatrix, [0.0, 3, 4]);
	mat4.scale(scene[0].children[6].children[0].sclMatrix, [0.5, 0.5, 0.5]);

	//scene[4].updateFunc = spinner;
	//scene[1].children[0].updateFunc = spinner;

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
	object.updateFunc();

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