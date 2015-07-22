three-mm3d
==========

A Misfit Model 3D format (.mm3d) loader for three.js. This is not based on .mm3d to .json converters. This code actually loads and parses the binary file itself.

~~NOTE: As of the time of writing this note, I found that a peculiarity of three.js animation keys compromises usage of the skeletal animation features. An issue has been opened by me, https://github.com/mrdoob/three.js/issues/6065 and I am expecting that this is solved soon. Meanwhile, it is not recommend for skeletal animation features to be depended upon. Please rely on morph target animations only, as those aren't affected and are working correctly.~~ Skeletal animation features now can be depended upon due to patching keyframes during model loading. https://github.com/mrdoob/three.js/issues/6065 still remains.

See live demo at https://d61c20519de147ce3055249fdf53f3af0b22de1d.googledrive.com/host/0B9scOMN0JFaXVjgxYzllaVljdGc/test.html

P.S.: demo-r68 is source code for the demo compatible with three.js revision r68. This is the demo linked above. Between r67 and r68, three.js's animation system was changed. For r67 compatible code, see demo-r67. Live demo for demo-r67 is here: https://b391e55ae15b45d7ed9872931f9ef0e1f7e3541a.googledrive.com/host/0B9scOMN0JFaXY0ptc2haSTdZR3c/test.html .
demo-r68 has been tested with and is also compatible with three.js revisions r69, r70 and r71.
