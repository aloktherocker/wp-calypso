/**
 * External dependencies
 */
import sinon from 'sinon';
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import {
	THEME_ACTIVATE,
	THEME_ACTIVATE_SUCCESS,
	THEME_ACTIVATE_FAILURE,
	THEME_REQUEST,
	THEME_REQUEST_SUCCESS,
	THEME_REQUEST_FAILURE,
	THEMES_RECEIVE,
	THEMES_REQUEST,
	THEMES_REQUEST_SUCCESS,
	THEMES_REQUEST_FAILURE
} from 'state/action-types';
import {
	themeActivation,
	themeActivated,
	themeActivationFailed,
	themeActivationSuccess,
	activateTheme,
	receiveTheme,
	receiveThemes,
	requestThemes,
	requestTheme
} from '../actions';
import useNock from 'test/helpers/use-nock';

describe( 'actions', () => {
	const spy = sinon.spy();

	beforeEach( () => {
		spy.reset();
	} );

	describe( '#receiveTheme()', () => {
		it( 'should return an action object', () => {
			const theme = { id: 'twentysixteen', name: 'Twenty Sixteen' };
			const action = receiveTheme( theme );

			expect( action ).to.eql( {
				type: THEMES_RECEIVE,
				themes: [ theme ]
			} );
		} );
	} );

	describe( '#receiveThemes()', () => {
		it( 'should return an action object', () => {
			const themes = [ { id: 'twentysixteen', name: 'Twenty Sixteen' } ];
			const action = receiveThemes( themes );

			expect( action ).to.eql( {
				type: THEMES_RECEIVE,
				themes
			} );
		} );
	} );

	describe( '#requestThemes()', () => {
		useNock( ( nock ) => {
			nock( 'https://public-api.wordpress.com:443' )
				.persist()
				.get( '/rest/v1.2/themes' )
				.reply( 200, {
					found: 2,
					themes: [
						{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
						{ ID: 'mood', name: 'Mood' }
					]
				} )
				.get( '/rest/v1.2/themes' )
				.query( { search: 'Sixteen' } )
				.reply( 200, {
					found: 1,
					themes: [ { ID: 'twentysixteen', name: 'Twenty Sixteen' } ]
				} )
				.get( '/rest/v1/sites/77203074/themes' )
				.reply( 200, {
					found: 2,
					themes: [
						{ ID: 'twentyfifteen', name: 'Twenty Fifteen' },
						{ ID: 'twentysixteen', name: 'Twenty Sixteen' }
					]
				} )
				.get( '/rest/v1/sites/77203074/themes' )
				.query( { search: 'Sixteen' } )
				.reply( 200, {
					found: 1,
					themes: [ { ID: 'twentysixteen', name: 'Twenty Sixteen' } ]
				} )
				.get( '/rest/v1/sites/1916284/themes' )
				.reply( 403, {
					error: 'authorization_required',
					message: 'User cannot access this private blog.'
				} );
		} );

		context( 'with a wpcom site', () => {
			it( 'should dispatch fetch action when thunk triggered', () => {
				requestThemes( 2916284 )( spy );

				expect( spy ).to.have.been.calledWith( {
					type: THEMES_REQUEST,
					siteId: 'wpcom',
					query: {}
				} );
			} );

			it( 'should dispatch themes receive action when request completes', () => {
				return requestThemes( 2916284 )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_RECEIVE,
						themes: [
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
							{ ID: 'mood', name: 'Mood' }
						]
					} );
				} );
			} );

			it( 'should dispatch themes themes request success action when request completes', () => {
				return requestThemes( 2916284 )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_REQUEST_SUCCESS,
						siteId: 'wpcom',
						query: {},
						found: 2,
						themes: [
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
							{ ID: 'mood', name: 'Mood' }
						]
					} );
				} );
			} );

			it( 'should dispatch themes request success action with query results', () => {
				return requestThemes( 2916284, false, { search: 'Sixteen' } )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_REQUEST_SUCCESS,
						siteId: 'wpcom',
						query: { search: 'Sixteen' },
						found: 1,
						themes: [
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
						]
					} );
				} );
			} );
		} );

		context( 'with a Jetpack site', () => {
			it( 'should dispatch fetch action when thunk triggered', () => {
				requestThemes( 77203074, true )( spy );

				expect( spy ).to.have.been.calledWith( {
					type: THEMES_REQUEST,
					siteId: 77203074,
					query: {}
				} );
			} );

			it( 'should dispatch themes receive action when request completes', () => {
				return requestThemes( 77203074, true )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_RECEIVE,
						themes: [
							{ ID: 'twentyfifteen', name: 'Twenty Fifteen' },
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
						]
					} );
				} );
			} );

			it( 'should dispatch themes themes request success action when request completes', () => {
				return requestThemes( 77203074, true )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_REQUEST_SUCCESS,
						siteId: 77203074,
						query: {},
						found: 2,
						themes: [
							{ ID: 'twentyfifteen', name: 'Twenty Fifteen' },
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
						]
					} );
				} );
			} );

			it( 'should dispatch themes request success action with query results', () => {
				return requestThemes( 77203074, true, { search: 'Sixteen' } )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_REQUEST_SUCCESS,
						siteId: 77203074,
						query: { search: 'Sixteen' },
						found: 1,
						themes: [
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
						]
					} );
				} );
			} );

			it( 'should dispatch fail action when request fails', () => {
				return requestThemes( 1916284, true )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_REQUEST_FAILURE,
						siteId: 1916284,
						query: {},
						error: sinon.match( { message: 'User cannot access this private blog.' } )
					} );
				} );
			} );
		} );
	} );

	describe( '#requestTheme()', () => {
		useNock( ( nock ) => {
			nock( 'https://public-api.wordpress.com:443' )
				.persist()
				.get( '/rest/v1.1/sites/2916284/themes/413' )
				.reply( 200, { ID: 413, title: 'Ribs & Chicken' } )
				.get( '/rest/v1.1/sites/2916284/themes/420' )
				.reply( 404, {
					error: 'unknown_theme',
					message: 'Unknown theme'
				} );
		} );

		it( 'should dispatch request action when thunk triggered', () => {
			requestTheme( 2916284, 413 )( spy );

			expect( spy ).to.have.been.calledWith( {
				type: THEME_REQUEST,
				siteId: 2916284,
				themeId: 413
			} );
		} );

		it( 'should dispatch themes receive action when request completes', () => {
			return requestTheme( 2916284, 413 )( spy ).then( () => {
				expect( spy ).to.have.been.calledWith( {
					type: THEMES_RECEIVE,
					themes: [
						sinon.match( { ID: 413, title: 'Ribs & Chicken' } )
					]
				} );
			} );
		} );

		it( 'should dispatch themes request success action when request completes', () => {
			return requestTheme( 2916284, 413 )( spy ).then( () => {
				expect( spy ).to.have.been.calledWith( {
					type: THEME_REQUEST_SUCCESS,
					siteId: 2916284,
					themeId: 413
				} );
			} );
		} );

		it( 'should dispatch fail action when request fails', () => {
			return requestTheme( 2916284, 420 )( spy ).then( () => {
				expect( spy ).to.have.been.calledWith( {
					type: THEME_REQUEST_FAILURE,
					siteId: 2916284,
					themeId: 420,
					error: sinon.match( { message: 'Unknown theme' } )
				} );
			} );
		} );
	} );

	describe( '#themeActivation()', () => {
		it( 'should return an action object', () => {
			const themeId = 'twentysixteen';
			const siteId = 2211667;
			const expected = {
				type: THEME_ACTIVATE,
				themeId,
				siteId,
			};

			const action = themeActivation( themeId, siteId );
			expect( action ).to.eql( expected );
		} );
	} );

	describe( '#themeActivated()', () => {
		it( 'should return an action object', () => {
			const themeId = 'twentysixteen';
			const siteId = 2211667;
			const expected = {
				type: THEME_ACTIVATE_SUCCESS,
				themeId,
				siteId,
			};

			const action = themeActivated( themeId, siteId );
			expect( action ).to.eql( expected );
		} );
	} );

	describe( '#themeActivationFailed()', () => {
		it( 'should return an action object', () => {
			const themeId = 'twentysixteen';
			const siteId = 2211667;
			const error = { error: 'unknown_theme', message: 'Unknown theme' };
			const expected = {
				type: THEME_ACTIVATE_FAILURE,
				themeId,
				siteId,
				error,
			};

			const action = themeActivationFailed( themeId, siteId, error );
			expect( action ).to.eql( expected );
		} );
	} );

	const trackingData = {
		theme: 'twentysixteen',
		previous_theme: 'twentyfifteen',
		source: 'unknown',
		purchased: false,
		search_term: 'simple, white'
	};

	const expectedActivationSuccess = {
		meta: {
			analytics: [
				{
					payload: {
						name: 'calypso_themeshowcase_theme_activate',
						properties: {
							previous_theme: 'twentyfifteen',
							purchased: false,
							search_term: 'simple, white',
							source: 'unknown',
							theme: 'twentysixteen',
						},
						service: 'tracks',
					},
					type: 'ANALYTICS_EVENT_RECORD'
				},
			],
		},
		type: THEME_ACTIVATE_SUCCESS,
		themeId: 'twentysixteen',
		siteId: 2211667,
	};

	describe( '#themeActivationSuccess', () => {
		it( 'should return an action object', () => {
			const themeId = 'twentysixteen';
			const siteId = 2211667;

			const action = themeActivationSuccess( themeId, siteId, trackingData );
			expect( action ).to.eql( expectedActivationSuccess );
		} );
	} );

	describe( '#activateTheme', () => {
		const themeId = 'twentysixteen';
		const siteId = 2211667;
		useNock( ( nock ) => {
			nock( 'https://public-api.wordpress.com:443' )
				.persist()
				.post( '/rest/v1.1/sites/2211667/themes/mine', { theme: themeId } )
				.reply( 200, { id: 'karuna', version: '1.0.3' } );
		} );

		it( 'should dispatch request action when thunk triggered', () => {
			activateTheme( themeId, siteId )( spy );

			expect( spy ).to.have.been.calledWith( {
				type: THEME_ACTIVATE,
				siteId,
				themeId,
			} );
		} );

		it( 'should dispatch theme activation success action when request completes', () => {
			return activateTheme( themeId, siteId, trackingData )( spy ).then( () => {
				expect( spy ).to.have.been.calledWith( expectedActivationSuccess );
			} );
		} );
	} );
} );
