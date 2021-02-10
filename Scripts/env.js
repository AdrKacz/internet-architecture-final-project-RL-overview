
// Helper

function modulo(n, m){
	return ((n % m) + m) % m;
}

// Environment
function Environment() {
	this.name = "Frozen Lake";

	this.action_space = ['up', 'right', 'bottom', 'left'];

	this.slip_p = .66;

	this.width = 4;
	this.height = 4;

	this.base_map = "	SFFF\
						FHFH\
						FFFH\
						HFFG";


	this.map = '';

	this.reward_mapping = {	'S'	: [0.001, false],
							'F'	: [0.001, false], 
							'H'	: [-.5, true] , 
							'G'	: [1, true]};

	// Comment the section above and uncomment the section below
	// to switch between the old reward system (below) and the
	// new reward system (above)
	
	// this.reward_mapping = {	'S'	: [0, false],
	// 						'F'	: [0, false], 
	// 						'H'	: [0, true] , 
	// 						'G'	: [1, true]};

	this.state = 0;

	this.reset();
};

Environment.prototype.generate_random_map = function(p_max) {

	function is_map_valid(map, w, h) {
		// Check if the given map has at least one path
		const directions = ['1.0', '0.1', '-1.0', '0.-1'];
		let search = [];
		let discovered = [];
		search.push('0.0');
		while (search.length > 0) {
			const look = search.pop()
			const xy = look.split('.');
			const x = Number(xy[0]);
			const y = Number(xy[1]);
			if (!discovered.includes(look)) {
				discovered.push(look);
				for (let i = 0; i < directions.length; i++) {
					const d = directions[i].split('.');
					const dx = Number(d[0]);
					const dy = Number(d[1]);

					const x_new = x + dx;
					const y_new = y + dy;
					if (x_new >= 0 && x_new < w && y_new >= 0 && y_new < h) {
						if (map[y_new][x_new] === 'G') {
							return true
						}
						else if (!(map[y_new][x_new] === 'H')) {
							search.push([x_new, y_new].join('.'));
						};
					};
				};
			};
		};

		return false;
	};

	let map = []
	let map_text = '';
	let p = Math.min(1, p_max); // propabilty of being F tile
	p = Math.max(0.1, p); // else no solution fast enough
	do {
		map_text = '';
		map = [];
		for (let i = 0; i < this.height; i++) {
			map[i] = [];
			for (let j = 0; j < this.width; j++) {
				if (Math.random() > 1 - p) {
					map[i].push('F');
					map_text += 'F';
				}
				else {
					map[i].push('H');
					map_text += 'H';
				};
			};
		};
		map[0][0] = 'S';
		map[this.height - 1][this.width - 1] = 'G';

	} while (!is_map_valid(map,this.width, this.height)); 

	map_text = 'S' + map_text.substring(1, map_text.length - 1) + 'G';

	return map_text;
};

Environment.prototype.reset = function(use_random, make=true) {
	if (make) {
		if (use_random) {
			this.width = 4;
			this.height = 4;
			this.map = this.generate_random_map(.7);
		} else {
			this.width = 4;
			this.height = 4;
			this.map = this.base_map.replace(/\t/g,'');
		};
	};

	this.state = 0;
	return this.state;
};


Environment.prototype.step = function(action) {
	let new_state = 0;
	let reward = 0;
	let done = false;
	let info = "";

	const action_index = this.action_space.indexOf(action);

	if (Math.random() > 1 - this.slip_p) { // Slip
		if (Math.random() > .5) {
			new_state = this.move(this.action_space[modulo(action_index - 1, 4)])
		} else {
			new_state = this.move(this.action_space[modulo(action_index + 1, 4)])
		};
	} else { // Don't slip
		new_state = this.move(action);
	};

	reward = this.reward_mapping[this.map[new_state]][0];
	
	if (this.reward_mapping[this.map[new_state]][1]) {
		done = true;
	}

	return {'new_state':new_state, 'reward':reward, 'done':done, 'info':info};
};

Environment.prototype.move = function(direction) {
	const direction_index = this.action_space.indexOf(direction);
	if (direction === 'up') {
		if (Math.floor(this.state / this.width) > 0) { // Not up line
			this.state -= this.width;
		};
	}
	else if (direction === 'right') {
		if (modulo(this.state, this.width) < this.width - 1) { // Not right line
			this.state += 1;
		};
	}
	else if (direction === 'bottom') {
		if (Math.floor(this.state / this.width) < this.height - 1) { // Not bottom line
			this.state += this.width;
		};
	}
	else if (direction === 'left') {
		if (modulo(this.state, this.width) > 0) { // Not left line
			this.state -= 1;
		};
	};

	return this.state;
};

Environment.prototype.render = function(type, object) {
	// console.log(this.state);
	if (type === 'text') {
		while (object.firstChild) {
			object.removeChild(object.firstChild);
		}
		let observation = this.map.replace('S','F');
		observation = observation.split('');
		observation[this.state] = 'S';

		// let lines = [];
		// let rendering = "";

		let node;
		for (let i = 0; i < this.height; i++) {
			for (let j = 0; j < this.width; j++) {
				if (this.width * i + j === this.state) {
					node = document.createElement('em');
					node.textContent = observation[this.width * i + j];
				}
				else {
					node = document.createTextNode(observation[this.width * i + j]);
				};
				
				object.appendChild(node);
			}
			node = document.createTextNode('\n');
			object.appendChild(node);
		};
	};
};
