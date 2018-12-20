"use strict"
let $ = require('jquery');

module.exports = class NameGame {
	constructor(args, opts){
		this.args = args;
		this.opts = opts;
		this.gameTypes = {
			'nameThatFace': {
				'description': 'Choose a name from a set of choices to match a picture.', 
				'title': 'Name That Face',
			}, 
			'faceThatName': {
				'description': 'Choose a picture from a set of choices to match a name.', 
				'title': 'Face That Name',
			}, 
			'mattOrNott': {
				'description': 'On a scale of -5 to 5, judge how Matt someone is based on their picture.', 
				'title': 'Matt or Nott',
			}, 
			'theTest': {
				'description': 'A set number of random question types make up a timed test.', 
				'title': 'The Test©™',
			},
		};
		this.navs = {
			'thermonuclearWarfare': {
				'description': 'Do you even know what you are doing?', 
				'title': 'Thermonuclear Warfare',
			},
			'history': {
				'description': 'See the history of games and tests played on this browser.', 
				'title': 'Game History',
			},
		};
		this.currentTest = false;
		this.currentTestIndex = 0;
	}

	init() {
		this.gameType = false;
		this.stages = {
			'$loading'   : $('.stage-loading'),
			'$home'      : $('.stage-home'),
			'$question' : $('.stage-question'),
			'$segway'   : $('.stage-segway'),
			'$history'   : $('.stage-history'),
		};
		this.templateMenuItem = $('#main-nav-item', this.stages.$home).html().trim();
		this.templateQuestionItemImage = $('#question-image', this.stages.$question).html().trim();
		this.templateQuestionItemText = $('#question-text', this.stages.$question).html().trim();
		this.templateAnswerItemImage = $('#answer-image', this.stages.$question).html().trim();
		this.templateAnswerItemText = $('#answer-text', this.stages.$question).html().trim();
		const $gameNav = $('.nav-game', this.stages.$home);
		let key;
		let navigation = {};

		$('.status', this.stages.$loading).html('Loading Data');

		this.loadData( (data) => {
			if(typeof data !== 'object') {
				error( 'API did not return proper data' );
				// TODO: Show user the error
				return false;
			}
			this.data =	new Map();
			this.dataIds = [];
			for( key in Object.keys(data) ) {
				this.data.set(data[key]['id'], data[key]);
				this.dataIds.push(data[key]['id']);
			}

			/* I know, I am a horrible person. But that narwhal comment is cool. */
			/* And it looks like we are actually doing something important in the background. */
			setTimeout(() => {this.gameReady();}, 1000);
		} );

		/* Setup Menu */
		/* Combine the game types with the other navigation items we have. */
		Object.assign(navigation, this.gameTypes, this.navs);
		for( key in navigation ) {
			let newItem = this.templateMenuItem
				.replace('{slug}', key)
				.replace('{title}', navigation[key]['title'])
				.replace('{description}', navigation[key]['description']);
			$(newItem)
				.on('click', (event) => {
					event.stopPropagation();
					event.preventDefault();
					this.startGame( event.currentTarget.href.hash.replace('#','') );
				})
				.appendTo( $gameNav );
		}

		$('input', this.stages.$question).on('change', (event) => {console.log(event.currentTarget);})
	}

	loadData(callback) {
		$.ajax({
		    url: 'https://willowtreeapps.com/api/v1.0/profiles/',
		    success: callback,
		    fail: ( jqXHR, textStatus ) => {
				error( 'Request failed: ' + textStatus );
			},
		});
	}

	gameReady() {
		const hash = window.location.hash.replace('#','')

		$('.status', this.stages.$loading).html('Game is ready!');

		if( hash && this.gameTypes.hasOwnProperty( hash ) ) {
			this.startGame( hash );
		} else {
			this.transition('$home');
		}
	}


	startGame( type ) {
		this.gameType = type;
		this.currentTest = this.buildTest( type );
		// Setup Questions
		this.askQuestion();
	}

	askQuestion() {
		const currentQuestion = this.currentTest[this.currentTestIndex];
		let question = '',
		    answers = '';
		
		this.stages.$question
			.removeClass('type-mattOrNott')
			.removeClass('type-nameThatFace')
			.removeClass('type-faceThatName')
			.addClass('type-' + currentQuestion.type);

		switch(currentQuestion.type) {
			case 'mattOrNott':
				question = this.templateQuestionItemImage
					.replace('{{question}}', 'How Matt does this person look?')
					.replace('{{img-src}}', this.data.get(currentQuestion.answer).headshot.url);
					for(let i = -4; i <= 4; i++) {
						answers += this.templateAnswerItemText
							.replace('{{id}}', i)
							.replace('{{name}}', i)
							.replace('{{shortcut}}', i+5);
					}
				break;
			case 'nameThatFace':
				question = this.templateQuestionItemImage
					.replace('{{question}}', 'What is this person\'s name?')
					.replace('{{img-src}}', this.data.get(currentQuestion.answer).headshot.url);
				for(let i = 0; i < 3; i++) {
					answers += this.templateAnswerItemText
						.replace('{{id}}', currentQuestion.options[i])
						.replace('{{name}}', this.data.get(currentQuestion.options[i]).firstName + ' ' + this.data.get(currentQuestion.options[i]).lastName)
						.replace('{{shortcut}}', i+1);
				}
				break;
			case 'faceThatName':
				question = this.templateQuestionItemText
					.replace('{{question}}', 'Who does or did this person look like?')
					.replace('{{name}}', this.data.get(currentQuestion.answer).firstName + ' ' + this.data.get(currentQuestion.answer).lastName);
				for(let i = 0; i < 3; i++) {
					answers += this.templateAnswerItemImage
						.replace('{{id}}', currentQuestion.options[i])
						.replace('{{img-src}}', this.data.get(currentQuestion.options[i]).headshot.url)
						.replace('{{shortcut}}', i+1);
				}
				break;
			default:
		}

		$('.question', this.stages.$question).html(question);
		$('.answers', this.stages.$question).html(answers);

		// register events
		this.transition('$question');
		// Wait for clicks

	}
	answer( id ) {
		// Save answer to data
		// If not test, give feedback
		this.transition('$segway');
		// else Segway
		// Go to next question or conclusion

	}
	transition(newStage) {
		let key;
		for( key in this.stages ) {
			this.stages[key].removeClass('active');
		}
		this.stages[newStage].addClass('active');
	}
	buildTest(type, count = 10, options = 4) {
		let test = [];
		const types = Object.keys( this.gameTypes );

		/* Prevents infinite loop trying to find answers and options. */
		count = count > this.dataIds.length ? this.dataIds.length : count;
		options = options > (this.dataIds.length-1) ? (this.dataIds.length-1) : options;

		if( count <= 2 ) {
			throw new Error('There are not enough entries in the data to create a test.');
		}

		/* Making pasta with the magic sauce. */
		/* Keep going until you have made a number of questions that equals count. */
		/* Find an ID to be our answer that is not currently in the test/ */
		/* Find three other IDs that are not the answer or existing answer. */
		while( Object.keys(test).length < count ) {
			let answerId = this.dataIds[Math.floor(Math.random()*this.dataIds.length)];
			let options = [];
			let thisType = type;

			while(thisType === 'theTest') { 
				let number = Math.floor(Math.random()*types.length);
				thisType = types[number];
			}

			if( !Object.keys(test).includes(answerId) ) {
				if (thisType === 'nameThatFace' || thisType === 'faceThatName'){
					console.log('getting options');
					while( options.length < 3 ) {
						let optionId = this.dataIds[Math.floor(Math.random()*this.dataIds.length)];
						if( optionId !== answerId && !Object.keys(options).includes(optionId) ) {
							options.push(optionId);
						} /* Unique option condition */
					} /* Option loop */
				} /* Question type condition (Do not need options for Matt Or Nott)*/

				test.push({
					'type'    : thisType,
					'answer'  : answerId,
					'options' : options,
				});
			} /* Unique answer condition */
		} /* Answer loop */
console.log(test);
		return test;

	}
}

function error(str) {
	console.log('Error: ' + str);
}
