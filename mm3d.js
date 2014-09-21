function MM3DModel(fileName)
{
	this.textures = [];
	this.materials = [];
	this.skeletalAnimations = [];
	this.frameAnimations = [];
	this.frameAnimationPoints = [];
	this.vertices = [];
	this.triangles = [];
	this.joints = [];
	this.jointVertices = [];
	this.points = [];
	this.weights = [];
	this.texCoords = [];
	if(typeof(fileName) == "string") this.Load(fileName);
}

MM3DModel.prototype.Load = function (url)
{
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.overrideMimeType('text/plain; charset=x-user-defined');
	request.send(null);
	request.mm3d = this;
	request.onreadystatechange = function()
	{
		if((this.readyState == 4) && (this.status == 200)) this.mm3d.Parse(this.responseText);
	}
}

MM3DModel.prototype.Parse = function(file)
{
	var view = new jDataView(file, 0, file.length, true);
	
	view.getCString = function()	// Stupid jDataView getString function doesn't check for \0
	{
		var str = "";
		var charCode = 1;
		while(charCode != 0)
		{
			charCode = this.getUint8();
			if(charCode != 0) str += String.fromCharCode(charCode);
		}
		return str;
	}
	
	// Format specification is from http://www.misfitcode.com/misfitmodel3d/olh_mm3dformat.html
	
	this.magicNumber = [];
	this.magicNumber[0] = view.getUint32();
	this.magicNumber[1] = view.getUint32();
	this.majorVersion = view.getUint8();
	this.minorVersion = view.getUint8();
	this.flags = view.getUint8();
	var offsetCount = view.getUint8();
	
	var texturesOffset = -1;
	var materialsOffset = -1;
	var skeletalAnimationsOffset = -1;
	var frameAnimationsOffset = -1;
	var frameAnimationPointsOffset = -1;
	var verticesOffset = -1;
	var trianglesOffset = -1;
	var jointsOffset = -1;
	var jointVerticesOffset = -1;
	var pointsOffset = -1;
	var weightsOffset = -1;
	var texCoordsOffset = -1;
	
	for(var i = 0; i < offsetCount; i++)
	{
		var offsetType = view.getUint16();
		var offsetValue = view.getUint32();
		if(offsetType == 0x0142) texturesOffset = offsetValue;
		if(offsetType == 0x0161) materialsOffset = offsetValue;
		if(offsetType == 0x0301) skeletalAnimationsOffset = offsetValue;
		if(offsetType == 0x0321) frameAnimationsOffset = offsetValue;
		if(offsetType == 0x0326) frameAnimationPointsOffset = offsetValue;
		if(offsetType == 0x8001) verticesOffset = offsetValue;
		if(offsetType == 0x8021) trianglesOffset = offsetValue;
		if(offsetType == 0x8041) jointsOffset = offsetValue;
		if(offsetType == 0x8046) jointVerticesOffset = offsetValue;
		if(offsetType == 0x8061) pointsOffset = offsetValue;
		if(offsetType == 0x8146) weightsOffset = offsetValue;
		if(offsetType == 0x8121) texCoordsOffset = offsetValue;
	}
	
	if(texturesOffset >= 0)
	{
		view.seek(texturesOffset);
		view.getUint16();
		var numberOfTextures = view.getUint32();
		for(var i = 0; i < numberOfTextures; i++)
		{
			var textureSize = view.getUint32();
			view.getUint16();
			this.textures.push(view.getCString());
		}
	}
	
	if(materialsOffset >= 0)
	{
		view.seek(materialsOffset);
		view.getUint16();
		var numberOfMaterials = view.getUint32();
		for(var i = 0; i < numberOfMaterials; i++)
		{
			var materialSize = view.getUint32();
			view.getUint16();
			this.materials.push(
			{
				texture: view.getUint32(),
				name: view.getCString(),
				ambient: [view.getFloat32(), view.getFloat32(), view.getFloat32(), view.getFloat32()],
				diffuse: [view.getFloat32(), view.getFloat32(), view.getFloat32(), view.getFloat32()],
				specular: [view.getFloat32(), view.getFloat32(), view.getFloat32(), view.getFloat32()],
				emissive: [view.getFloat32(), view.getFloat32(), view.getFloat32(), view.getFloat32()],
				shininess: view.getFloat32()
			});
		}
	}
	
	if(skeletalAnimationsOffset >= 0)
	{
		view.seek(skeletalAnimationsOffset);
		view.getUint16();
		var numberOfSkeletalAnimations = view.getUint32();
		for(var i = 0; i < numberOfSkeletalAnimations; i++)
		{
			var skeletalAnimationSize = view.getUint32();
			view.getUint16();
			var skeletalAnimation = 
			{
				name: view.getCString(),
				fps: view.getFloat32(),
				frames: []
			};
			var numberOfSkeletalAnimationFrames = view.getUint32();
			for(var j = 0; j < numberOfSkeletalAnimationFrames; j++)
			{
				var numberOfKeyframes = view.getUint32();
				var frame = [];
				for(var k = 0; k < numberOfKeyframes; k++)
				{
					frame.push(
					{
						joint: view.getUint32(),
						type: view.getUint8(),
						vector: [view.getFloat32(), view.getFloat32(), view.getFloat32()]
					});
				}
				skeletalAnimation.frames.push(frame);
			}
			this.skeletalAnimations.push(skeletalAnimation);
		}
	}
	
	if(verticesOffset >= 0)
	{
		view.seek(verticesOffset);
		view.getUint16();
		var numberOfVertices = view.getUint32();
		var vertexSize = view.getUint32();
		for(var i = 0; i < numberOfVertices; i++)
		{
			this.vertices.push(
			{
				flags: view.getUint16(),
				position: [view.getFloat32(), view.getFloat32(), view.getFloat32()]
			});
		}
	}
	
	if(frameAnimationsOffset >= 0)
	{
		view.seek(frameAnimationsOffset);
		view.getUint16();
		var numberOfFrameAnimations = view.getUint32();
		for(var i = 0; i < numberOfFrameAnimations; i++)
		{
			var frameAnimationSize = view.getUint32();
			view.getUint16();
			var frameAnimation =
			{
				name: view.getCString(),
				fps: view.getFloat32(),
				frames: []
			}
			var numberOfFrameAnimationFrames = view.getUint32();
			for(var j = 0; j < numberOfFrameAnimationFrames; j++)
			{
				var vertices = [];
				for(var k = 0; k < this.vertices.length; k++)
				{
					vertices.push({x: view.getFloat32(), y: view.getFloat32(), z: view.getFloat32()});
				}
				frameAnimation.frames.push({vertices: vertices});
			}
			this.frameAnimations.push(frameAnimation);
		}
	}
	
	if(frameAnimationPointsOffset >= 0)
	{
		view.seek(frameAnimationPointsOffset);
		view.getUint16();
		var numberOfFrameAnimationPoints = view.getUint32();
		for(var i = 0; i < numberOfFrameAnimationPoints; i++)
		{
			var frameAnimationPointsSize = view.getUint32();
			view.getUint16();
			this.frameAnimationPoints.push(
			{
				index: view.getUint32(),
				followingFrames: view.getUint32(),
				points: []
			});
		}
	}
	
	if(trianglesOffset >= 0)
	{
		view.seek(trianglesOffset);
		view.getUint16();
		var numberOfTriangles = view.getUint32();
		var triangleSize = view.getUint32();
		for(var i = 0; i < numberOfTriangles; i++)
		{
			this.triangles.push(
			{
				flags: view.getUint16(),
				vertices: [view.getUint32(), view.getUint32(), view.getUint32()]
			});
		}
	}
	
	if(jointsOffset >= 0)
	{
		view.seek(jointsOffset);
		view.getUint16();
		var numberOfJoints = view.getUint32();
		var jointSize = view.getUint32(); // And it makes me feel alright...
		for(var i = 0; i < numberOfJoints; i++)
		{
			this.joints.push(
			{
				flags: view.getUint16(),
				name: view.getString(40),
				parentIndex: view.getInt32(),	// Format specification says parentIndex is unsigned, but actually it's signed
				rotation: [view.getFloat32(), view.getFloat32(), view.getFloat32()],
				translation: [view.getFloat32(), view.getFloat32(), view.getFloat32()]
			});
		}
	}
	
	if(jointVerticesOffset >= 0)
	{
		view.seek(jointVerticesOffset);
		view.getUint16();
		var numberOfJointVertices = view.getUint32();
		var jointVerticesSize = view.getUint32();
		for(var i = 0; i < numberOfJointVertices; i++)
		{
			this.jointVertices.push(
			{
				vertexIndex: view.getUint32(),
				jointIndex: view.getUint32()
			});
		}
	}
	
	if(pointsOffset >= 0)
	{
		view.seek(pointsOffset);
		view.getUint16();
		var numberOfPoints = view.getUint32();
		var pointSize = view.getUint32();
		for(var i = 0; i < numberOfPoints; i++)
		{
			this.points.push(
			{
				flags: view.getUint16(),
				name: view.getString(40),
				type: view.getUint32(),
				parent: view.getUint32(),
				rotation: [view.getFloat32(), view.getFloat32(), view.getFloat32()],
				translation: [view.getFloat32(), view.getFloat32(), view.getFloat32()]
			});
		}
	}
	
	if(weightsOffset >= 0)
	{
		view.seek(weightsOffset);
		view.getUint16();
		var numberOfWeights = view.getUint32();
		var weightSize = view.getUint32();
		for(var i = 0; i < numberOfWeights; i++)
		{
			this.weights.push(
			{
				type: getUint8(),
				influencedIndex: getUint32(),
				jointIndex: getUint32(),
				influenceType: getUint8(),
				weight: getInt8()
			});
		}
	}
	
	if(texCoordsOffset >= 0)
	{
		view.seek(texCoordsOffset);
		view.getUint16();
		var numberOfTexCoords = view.getUint32();
		var texCoordSize = view.getUint32();
		for(var i = 0; i < numberOfTexCoords; i++)
		{
			this.texCoords.push(
			{
				flags: view.getUint16(),
				triangle: view.getUint32(),
				s: [view.getFloat32(), view.getFloat32(), view.getFloat32()],
				t: [view.getFloat32(), view.getFloat32(), view.getFloat32()]
			});
		}
	}
	
	if(typeof this.OnLoad == "function") this.OnLoad();
}

MM3DModel.prototype.GetGeometry = function()
{
	var geometry = new THREE.Geometry();
	
	if(this.texCoords.length > 0) geometry.faceVertexUvs[0] = [];
	for(var i = 0; i < this.triangles.length; i++)
	{
		var face = new THREE.Face3();
		face.a = this.triangles[i].vertices[0];
		face.b = this.triangles[i].vertices[1];
		face.c = this.triangles[i].vertices[2];
		geometry.faces.push(face);
		
		var texCoord = null;
		for(var j = 0; j < this.texCoords.length; j++)
		{
			if(this.texCoords[j].triangle == i) texCoord = this.texCoords[j];
		}
		if(texCoord != null)
		{
			geometry.faceVertexUvs[0][i] = [];
			geometry.faceVertexUvs[0][i].push(new THREE.Vector2(texCoord.s[0], texCoord.t[0]));
			geometry.faceVertexUvs[0][i].push(new THREE.Vector2(texCoord.s[1], texCoord.t[1]));
			geometry.faceVertexUvs[0][i].push(new THREE.Vector2(texCoord.s[2], texCoord.t[2]));
		}
	}
	
	geometry.vertices = [];
	for(var i = 0; i < this.vertices.length; i++) geometry.vertices.push(new THREE.Vector3(this.vertices[i].position[0], this.vertices[i].position[1], this.vertices[i].position[2]));
	
	for(var i = 0, k = 0; i < this.frameAnimations.length; i++)
	{
		for(var j = 0; j < this.frameAnimations[i].frames.length; j++, k++)
		{
			geometry.morphTargets[k] = 
			{
				name: (this.frameAnimations[i].name + ("000000" + j).substr(("000000" + j).length - 6)).toLowerCase(),
				vertices: []
			};
			for(var l = 0; l < this.frameAnimations[i].frames[j].vertices.length; l++)
			{
				geometry.morphTargets[k].vertices.push(new THREE.Vector3(this.frameAnimations[i].frames[j].vertices[l].x, this.frameAnimations[i].frames[j].vertices[l].y, this.frameAnimations[i].frames[j].vertices[l].z));
			}
		}
	}
	
	if(this.joints.length > 0) geometry.bones = [];
	for(var i = 0; i < this.joints.length; i++)
	{
		var q = new THREE.Quaternion();
		q.setFromEuler(new THREE.Euler(this.joints[i].rotation[0], this.joints[i].rotation[1], this.joints[i].rotation[2], "XYZ"));
		
		geometry.bones.push(
		{
			name: this.joints[i].name,
			parent: this.joints[i].parentIndex,
			pos: this.joints[i].translation,
			rotq: [q.x, q.y, q.z, q.w]
		});
	}
	
	if(this.weights.length > 0)		// I didn't test this part of the code, because AFAIK MM3D does not export the weights field, only the alternative jointVertices
	{
		geometry.skinWeights = [];
		geometry.skinIndices = [];
		
		var verticumWeights = [];
		for(var i = 0; i < this.vertices.length; i++) verticumWeights[i] = [];
		for(var i = 0; i < this.weights.length; i++)
		{
			if(this.weights[i].type == 0)
			{
				verticumWeights[this.weights[i].influencedIndex].push(
				{
					joint: this.weights[i].jointIndex,
					weight: this.weights[i].weight / 100
				});
			}
		}
		for(var i = 0; i < this.vertices.length; i++)
		{
			verticumWeights[i].sort(function (a,b){b.weight - a.weight});
			var x = (verticumWeights[i].length > 0) ? verticumWeights[i][0].weight : 0;
			var y = (verticumWeights[i].length > 1) ? verticumWeights[i][1].weight : 0;
			var z = (verticumWeights[i].length > 2) ? verticumWeights[i][2].weight : 0;
			var w = (verticumWeights[i].length > 3) ? verticumWeights[i][3].weight : 0;
			geometry.skinWeights.push(new THREE.Vector4(x, y, z, w));
			var a = (verticumWeights[i].length > 0) ? verticumWeights[i][0].joint : 0;
			var b = (verticumWeights[i].length > 1) ? verticumWeights[i][1].joint : 0;
			var c = (verticumWeights[i].length > 2) ? verticumWeights[i][2].joint : 0;
			var d = (verticumWeights[i].length > 3) ? verticumWeights[i][3].joint : 0;
			geometry.skinIndices.push(new THREE.Vector4(a, b, c, d));
		}
	}
	else if(this.jointVertices.length > 0)
	{
		geometry.skinWeights = [];
		geometry.skinIndices = [];
		for(var i = 0; i < this.vertices.length; i++)
		{
			var jointIndex = -1;
			for(var j = 0; j < this.jointVertices.length; j++)
			{
				if(this.jointVertices[j].vertexIndex == i) jointIndex = this.jointVertices[j].jointIndex;
			}
			if(jointIndex > 0)
			{
				geometry.skinWeights[i] = new THREE.Vector4(1, 0, 0, 0);
				geometry.skinIndices[i] = new THREE.Vector4(jointIndex, 0, 0, 0);
			}
			else
			{
				geometry.skinWeights[i] = new THREE.Vector4(0, 0, 0, 0);
				geometry.skinIndices[i] = new THREE.Vector4(0, 0, 0, 0);
			}
		}
	}
	
	return geometry;
}

MM3DModel.prototype.GetSkeletalAnimations = function()
{
	var animations = [];
	for(var i = 0; i < this.skeletalAnimations.length; i++)
	{
		var _animation = this.skeletalAnimations[i];
		var animation =
		{
			name: _animation.name,
			length: _animation.frames.length / _animation.fps,
			hierarchy: [],
			fps: _animation.fps
		};
		
		for(var j = 0; j < this.joints.length; j++)
		{
			animation.hierarchy[j] =
			{
				parent: this.joints[i].parentIndex,
				keys: []
			};
		}
		
		for(var j = 0; j < _animation.frames.length; j++)
		{
			var time = j / _animation.fps;
			var _keys = _animation.frames[j];
			
			var __keys = [];
			
			for(var k = 0; k < _keys.length; k++)
			{
				var _key = _keys[k];
				if(typeof __keys[_key.joint] == "undefined") __keys[_key.joint] = {};
				// I SPENT THE FUCKING ENTIRE AFTERNOON LOOKING FOR BUGS
				// AND IT WAS ALL DUE TO AN ERROR IN THE STUPID SPECS
				// Specs say:
				// SKEL_KEYFRAME_ANIM_TYPE	uint8	Keyframe type: 0 = translation, 1 = rotation
				// but actually this is reversed
				// 1 = translation, 0 = rotation
				if(_key.type == 1) __keys[_key.joint].translation = _key.vector;
				if(_key.type == 0) __keys[_key.joint].rotation = _key.vector;
			}
			
			for(var k = 0; k < __keys.length; k++)
			{
				if(typeof __keys[k] == "undefined") continue;
				var __key = __keys[k];
				
				var key = {};
				
				key.pos = __key.translation ? __key.translation : [0, 0, 0];
				key.pos[0] += this.joints[k].translation[0];
				key.pos[1] += this.joints[k].translation[1];
				key.pos[2] += this.joints[k].translation[2];
				
				var rotArray = __key.rotation ? __key.rotation : [0, 0, 0];
				rotArray[0] += this.joints[k].rotation[0];
				rotArray[1] += this.joints[k].rotation[1];
				rotArray[2] += this.joints[k].rotation[2];
				var rotEuler = new THREE.Euler();
				rotEuler.fromArray(rotArray);
				var rotQuaternion = new THREE.Quaternion();
				rotQuaternion.setFromEuler(rotEuler);
				key.rot = [rotQuaternion.x, rotQuaternion.y, rotQuaternion.z, rotQuaternion.w];
				
				key.scl = [1, 1, 1];
				
				key.time = time;
				
				animation.hierarchy[k].keys.push(key);
			}
		}
		
		for(var j = 0; j < this.joints.length; j++)
		{
			if(animation.hierarchy[j].keys.length <= 0)
			{
				animation.hierarchy[j].keys.push(
				{
					pos: geometry.bones[j].pos,
					rot: geometry.bones[j].rotq,
					scl: [1, 1, 1],
					time: 0.001				// Must not be 0, but also must be greater than all key times
				});
			}
		}
		
		animations.push(animation);
	}
	
	return animations;
}