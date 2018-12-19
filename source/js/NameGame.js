"use strict"
let $ = require('jQuery');

module.exports = class NameGame {
	constructor(args, opts){
		this.args = args;
		this.opts = opts;
	}

	init() {
		this.data = false;
		this.gameType = false;
		this.$loadingStage = $('.stage-loading');
		this.$homeStage = $('.stage-home');
		this.$questionStage = $('.stage-question');
		this.$answerStage = $('.stage-answer');
		this.$segwayStage = $('.stage-segway');
		this.$histroyStage = $('.stage-history');

		$('.status', this.$loadingStage).html('Loading Data');

		this.loadData( (data) => {
			if(typeof data !== 'object') {
				error( 'API did not return proper data' );
				// TODO: Show user the error
				return false;
			}
			this.data = data;
			// I know, I am a horrible person. But that nahrwal comment is cool. 
			// And it looks like we are actually doing something important in the background. 
			setTimeout(() => {this.gameReady();}, 1000);
			
		} );
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
		$('.status', this.$loadingStage).html('Game is ready!');
		// console.log(this.data);
	}


	startGame( type ) {
		this.gameType = type;
		// Setup click event on answers
		askQuestion();
	}

	askQuestion() {
		// case: type
		// Render question
		// Render answers
		// Wait for clicks

	}
	answer() {
		// Save answer to data
		// If not test, give feedback
		// else Segway
		// Go to next question or conclusion

	}
}

function error(str) {
	console.log('Error: ' + str);
}
