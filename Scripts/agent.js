// Environment create in main.js

// helper modulo already create

// Agent
function Agent() {
	// Parameters
	this.num_episodes_object = {basic: 1e4, clever: 1e5};
	this.max_steps_per_episode = 100;

	this.learning_rate = 0.1;
	this.discount_rate = 0.99;

	this.max_exploration_rate = 1;
	this.min_exploration_rate = 0.01;
	this.exploration_decay_rate = 0.001;
	
	// Test Parameters
	this.num_test_episodes = 1e4;

	// Random
	this.random_remake = 1e3;

	// Q-table
	this.action_space_size = env.action_space.length;
	this.state_space_size = 0;

	this.num_episodes = this.num_episodes_object.basic;
	this.q_table = [];
}

Agent.prototype.train = function(use_clever_state) {
	// Initialize Q-Tables
	let use_random_generator = false;
	this.state_space_size = env.height * env.width;
	this.q_table = [];
	if (use_clever_state) {
		use_random_generator = true // if not the clever state has no sense to be done
		for (let i = 0; i < Math.pow(3,this.action_space_size); i++) {
			this.q_table.push([]);
			for (let j = 0; j < this.action_space_size; j++) {
				this.q_table[i].push(0);
			};
		};
	}
	else {
		for (let i = 0; i < this.state_space_size; i++) {
			this.q_table.push([]);
			for (let j = 0; j < this.action_space_size; j++) {
				this.q_table[i].push(0);
			};
		};
	};

	// Adjust the number of episode
	let last_remake = 0;
	if (use_clever_state) {
		this.num_episodes = this.num_episodes_object.clever;
	}
	else {
		this.num_episodes = this.num_episodes_object.basic;
	};

	
	// Q-learning Algorithm

	const rewards_all_episodes = [];

	let exploration_rate = this.max_exploration_rate;

	for (let episode = 0; episode < this.num_episodes; episode++) {
		let state = env.reset(use_random_generator, false);

		// If use_clever_state change the encoding of the environment
		if (use_clever_state) {
			state = this.get_clever_state();

			// If random for training, remake each this.random_remake episodes:
			if (episode - last_remake >= this.random_remake) {
				last_remake = episode
				state = env.reset(use_random_generator, true);
			};
		};

		let done = false;
		let rewards_current_episode = .0;

		let step = 0;
		while (step++ < this.max_steps_per_episode && !done) {
			let action_index;
			// Exploration vs. Exploitation
			if (Math.random() > exploration_rate) { // Exploitation
				action_index = this.exploit(use_clever_state);
			}
			else { // Exploration, Move at Random
				action_index = Math.floor(Math.random() * this.action_space_size);
			};
			action = env.action_space[action_index];

			let step_return = env.step(action);

			let new_state = step_return.new_state;
			if (use_clever_state) {
				new_state = this.get_clever_state();
			};

			// Update Q-table Q(s,a)
			this.q_table[state][action_index] = this.q_table[state][action_index] * (1 - this.learning_rate) + this.learning_rate * (step_return.reward + this.discount_rate * Math.max(...this.q_table[new_state]));

			state = new_state;
			done = step_return.done;

			// Only keep reward due to success (human reading facilitator)
			if (done && step_return.reward > 0) {
				rewards_current_episode += step_return.reward;
			};
		};


		// Exploration rate decay
		exploration_rate = this.min_exploration_rate + (this.max_exploration_rate - this.min_exploration_rate) * Math.exp(- this.exploration_decay_rate * episode);
		rewards_all_episodes.push(rewards_current_episode);
	};

	return rewards_all_episodes;
};

Agent.prototype.test = function(use_random_generator) {
	let cumulative_reward = .0;
	
	for (let episode = 0; episode < this.num_test_episodes; episode++) {
		let state = env.reset(use_random_generator, true);

		let done = false;
		let rewards_current_episode = .0;

		let step = 0;
		while (step++ < this.max_steps_per_episode && !done) {
			// Select the action to perform
			let action_index;
			if (agent.q_table.length > 0) {
				if (agent.q_table.length > this.state_space_size) {
					action_index = this.exploit(true);
				}
				else {
					action_index = this.exploit(false);
				};		
			}
			else {
				action_index = Math.floor(Math.random() * agent.action_space_size);
			};
			action = env.action_space[action_index];

			// Perform the action
			let step_return = env.step(action);

			done = step_return.done;
			// Only keep reward due to success (one success ==> +1 reward, easier for statistic)
			if (done && step_return.reward > 0) {
				rewards_current_episode += step_return.reward;
			};
		};
		cumulative_reward += rewards_current_episode;
	};
	return cumulative_reward / this.num_test_episodes;
};

Agent.prototype.exploit = function(use_clever_state) {
	let action_index = 0;
	let state = 0;
	if (use_clever_state) {
		state = this.get_clever_state();
		action_index = this.q_table[state].indexOf(Math.max(...this.q_table[state]));
	}
	else {
		state = env.state;
		action_index = this.q_table[state].indexOf(Math.max(...this.q_table[state]));
	};

	return action_index;
};

Agent.prototype.get_clever_state = function() {
	// Code to base 3.
	// ...
	// Action space: 4	{up, right, down, left}
	// Corresponding to pow	{0, 1, 2, 3}
	// ...
	// Case States enable 	{F, G, S, H, Wall}
	// F (or G or S),		pow {x} to 0
	// H, 					pow {x} to 1
	// Wall,				pow {x} to 2
	// ! Without goal BECAUSE always at the same place !


	let width = env.width;
	let height = env.height;
	let current_map = env.map;
	let current_state = env.state;
	let current_x = modulo(current_state, width);
	let current_y = Math.floor(current_state / width);

	let pow_list = [0, 0, 0, 0]

	// Check wall

	let wall_list = []
	if (current_y === 0) { // up line
		pow_list[0] = 2;
		wall_list.push(0);
	};
	if (current_x === width - 1) { // right line
		pow_list[1] = 2;
		wall_list.push(1);
	};
	if (current_y === height - 1) { // bottom line
		pow_list[2] = 2;
		wall_list.push(2);
	};
	if (current_x === 0) { // left line
		pow_list[3] = 2;
		wall_list.push(3);
	};

	// Check F and H
	for (let i = 0; i < this.action_space_size; i++) {
		if (!wall_list.includes(i)) {
			let look_x = current_x;
			let look_y = current_y;
			if (i === 0) { // up
				look_y -= 1;
			} else if (i === 1) { // right
				look_x += 1;
			} else if (i === 2) { // down
				look_y += 1;
			} else if (i === 3) { // left
				look_x -= 1;
			};

			if (current_map[width * look_y + look_x] === 'F' || current_map[width * look_y + look_x] === 'G' || current_map[width * look_y + look_x] === 'S') {
				pow_list[i] = 0;
			} else if (current_map[width * look_y + look_x] === 'H') {
				pow_list[i] = 1;
			} else {
				console.log("Unknown state at looking position... " + current_map[width * look_y + look_x]);
				console.log("Position Looking was: " + width * look_y + look_x);
				console.log("With x: " + look_x + ' and y: ' + look_y);
			};
		};
	};

	// Return state
	let state_index = 0;
	for (let i = 0; i < pow_list.length; i++){
		state_index += Math.pow(3, i) * pow_list[i];
	};

	return state_index;
};

Agent.prototype.get_average_rewards = function(rewards_all_episodes, count) {
	// Calculate and print the average reward per -count- episodes
	const rewards_per_count_episodes = [];

	for (let i = 0; i < rewards_all_episodes.length / count; i++) {
		let reward_average = 0;
		let j;
		for (j = i * count; j < Math.min(this.num_episodes, (i + 1) * count); j++){
			reward_average += rewards_all_episodes[j];
		};

		reward_average /= (j + 1) - (i * count);
		rewards_per_count_episodes.push((100 * reward_average).toFixed(3));
	};

	return rewards_per_count_episodes;
};

Agent.prototype.get_render_average_rewards = function(rewards_all_episodes, count) {
	// Get and print the average reward per -count- episodes
	const rewards_per_count_episodes = this.get_average_rewards(rewards_all_episodes, count);

	let rendering = "----- Average reward per thousand episodes -----\n";
	for (let i = 0; i < rewards_per_count_episodes.length; i++){
		rendering += ((i + 1) * count) + ":\t\t" + rewards_per_count_episodes[i] + ' %\n';
	};

	return rendering;
};

Agent.prototype.get_render_q_table = function() {
	// Show updated Q-table
	let rendering = "----- Q-table -----\n";

	for (let i = 0; i < this.q_table.length; i++){
		for (let j = 0; j < this.action_space_size; j++) {
			if (j < this.action_space_size - 1) {
				rendering += this.q_table[i][j].toFixed(2) + "\t";
			} else {
				rendering += this.q_table[i][j].toFixed(2);
			}
			
		};
		rendering += '\n';
	};

	return rendering;
};


