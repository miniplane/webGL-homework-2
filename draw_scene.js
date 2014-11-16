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
	mat4.rotate(this.posRotMatrix, degToRad(-0.010*elapsed), [0, 0, 1]);
}

var selected;
var scene;

function build_scene() {
	loadScene();
	scene = [
		new Object3D(pyramid),
		new Object3D(cube, [
			new Object3D(teapot)
		]),
		new Object3D(cylinder),
		new Object3D(sphere),
		//new Object3D(bunny),
		new Object3D(teapot)
	];

	mat4.translate(scene[0].posRotMatrix, [-3.0, 4.0, -15.0]);
	mat4.translate(scene[1].posRotMatrix, [ 0.0, 4.0, -15.0]);
	mat4.translate(scene[2].posRotMatrix, [ 3.0, 4.0, -15.0]);
	mat4.translate(scene[3].posRotMatrix, [-3.0, 0.0, -15.0]);
	mat4.translate(scene[4].posRotMatrix, [ 0.0, 0.0, -15.0]);

	mat4.translate(scene[1].children[0].posRotMatrix, [ 0.0, 1.0, 0.0]);

	scene[0].updateFunc = spinner;
	scene[4].updateFunc = spinner;
	scene[1].children[0].updateFunc = spinner;

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