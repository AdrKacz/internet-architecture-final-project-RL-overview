// Selectors
const title = document.querySelector("h2");
const text = document.querySelector("p");
const train_btn = document.querySelector("#train");
const play_btn = document.querySelector("#play");
const test_btn = document.querySelector('#test');
const q_table_btn = document.querySelector("#q_table");
const watch_btn = document.querySelector("#watch");

const use_random_checkbox = document.querySelector("#checkbox_random_map");
const use_clever_state_checkbox = document.querySelector("#checkbox_clever_state");

// Environment <--> Game
const env = new Environment;

// Agent <--> Player
const agent = new Agent;

// Global variable
let is_training = false;
let is_playing = false;
let is_watching = false;
let is_testing = false;

// Animation Frame
let rAF = null;
let last_time_update = 0;

let animation = {
	'rAF': null,
	'episode': 0,
	'step': 0,
	'reward': 0,
	'done': false,
	'next_delay': 500,
	'state': env.reset(use_random_checkbox.checked),
};

// Event Listeners
play_btn.addEventListener('click', play);
test_btn.addEventListener('click', test);
train_btn.addEventListener('click', train);
q_table.addEventListener('click', display_q_table);
watch_btn.addEventListener('click', watch);


// Event Functions

function play() {
	if (is_watching) {
		watch();
	}

	is_playing = !is_playing;
	if (is_playing) {
		play_btn.textContent = "Stop";
		title.textContent = "Playing"

		text.setAttribute('class', 'game');

		env.reset(use_random_checkbox.checked);
		env.render("text", text);

		window.addEventListener("keyup", move);
	}
	else {
		play_btn.textContent = "Play";
		title.textContent = "Pause";

		text.setAttribute('class', '');

		text.textContent = "Waiting ...";
		window.removeEventListener("keyup", move);
	};
};

function test() {
	if (is_playing) {
		play();
	}
	
	if (is_watching) {
		watch();
	}
	
	text.setAttribute('class', '');
	is_testing = true;

	title.textContent = "Test Phase";
	let average_success = agent.test(use_random_checkbox.checked);
	average_success = (100 * average_success).toFixed(3);
	title.textContent = "Test Result"

	let rendering = "The algorithm success rate is:\n\t\t" + average_success + " %.";
	text.textContent = rendering;
	
	is_testing = false;
		
	
}

function train() {
	if (is_playing) {
		play();
	};

	if (is_watching) {
		watch();
	};

	text.setAttribute('class', '');
	is_training = true;

	title.textContent = "Train Phase";
	let rewards_all_episodes = agent.train(use_clever_state_checkbox.checked);

	title.textContent = "Train Result";

	let rendering = "";
	if (use_clever_state_checkbox.checked) {
		rendering = agent.get_render_average_rewards(rewards_all_episodes, 1e4);
	} else {
		rendering = agent.get_render_average_rewards(rewards_all_episodes, 1e3);
	};

	text.textContent = rendering;

	is_training = false;
};

function display_q_table() {
	if (is_playing) {
		play();
	};

	if (is_watching) {
		watch();
	};

	text.setAttribute('class', '');
	title.textContent = "Q Table";
	let rendering = agent.get_render_q_table();
	text.textContent = rendering;
};

function watch() {
	if (is_playing) {
		play();
	};

	is_watching = !is_watching;
	if (is_watching) {
		text.setAttribute('class', 'game');
		watch_btn.textContent = "Stop";
		reset_animation();
		window.cancelAnimationFrame(rAF);
		rAF = window.requestAnimationFrame(update_agent);

	} else {
		text.setAttribute('class', '');
		watch_btn.textContent = "Watch";

		text.textContent = "Waiting ...";
		title.textContent = "Pause";

		window.cancelAnimationFrame(rAF);
	};

};

// Helper functions

function move(e) {
	const key = e.key.toLowerCase();
	let step_return;
	if (key === "arrowup") {
		step_return = env.step('up');
	}
	else if (key === "arrowright") {
		step_return = env.step('right');
	}
	else if (key === "arrowdown") {
		step_return = env.step('bottom');
	}
	else if (key === "arrowleft") {
		step_return = env.step('left');
	};

	if (step_return.done) {
		if (step_return.reward === 1) {
			title.textContent = "Goal Reached!"
		}
		else {
			title.textContent = "Fell throught a hole!"
		};
		env.reset(use_random_checkbox.checked);
	} 
	else {
		title.textContent = "Playing";
	};
	env.render("text", text);

};

function reset_animation() {
	animation = {
		'rAF': null,
		'episode': 0,
		'step': 0,
		'reward': 0,
		'done': false,
		'next_delay': 500,
		'state': env.reset(use_random_checkbox.checked, true),
	};
};


// Refresh functions

function update_agent(timestamp) {
	delay = (timestamp - last_time_update);

	let action_index;
	let action;
	let step_return;
	if (delay > animation.next_delay) {
		last_time_update = timestamp;
		env.render("text", text);

		// if (animation.episode >= 3) {
		// 	watch();
		// };

		if (agent.q_table.length > 0) {
			action_index = agent.exploit(use_clever_state_checkbox.checked);		
		}
		else {
			action_index = Math.floor(Math.random() * agent.action_space_size);
		};
		action = env.action_space[action_index];
		step_return = env.step(action);

		animation.done = step_return.done;
		animation.reward = step_return.reward;
		animation.state = step_return.new_state;

		animation.next_delay = 100;

		if (animation.step === 0) {
			title.textContent = "Episode " + (animation.episode + 1);
			animation.next_delay = 500;
		};
		animation.step += 1;

		if (animation.done) {
			if (animation.reward === 1) {
				title.textContent = 'Goal Reached!';
			}
			else {
				title.textContent = 'Fell throught a hole!';
			};

			let episode = animation.episode;
			reset_animation();
			animation.episode = episode + 1;
			animation.next_delay = 1000;
		};
	};

	if (is_watching) {
		rAF = window.requestAnimationFrame(update_agent);
	};
};



