///<reference path="../typings/index.d.ts"/>

import {Locator, WebElement, By, until} from 'selenium-webdriver';

require('colors');

const users: [{
	username?: string,
	displayName: string,
	password?: string,
	firstPage: string
}] = [
		{
			username: 'jennifermaxims1',
			displayName: 'Jennifer Maxims',
			password: 'password',
			firstPage: 'https://sprint-set-02-uat:d974371f@sprint-set-02-uat.ram-test.site'
		},
		{
			displayName: 'Bob Smith',
			firstPage: 'https://localhost:3001/#/relationships/LINK_ID%3AMY_GOV%3Abobsmith_identity_1'
		},
	];

const userIdx = 0;
const user = users[userIdx];
const EC = protractor.ExpectedConditions;

beforeAll(async function (cb) {
	cb();
});

describe("Login and Logout from OpenAM", function () {
	it("User can see authorisations page", async function (cb) {
		try {
			const bd = browser.driver;
			await bd.get(user.firstPage);
			await bd.wait(until.elementLocated(By.css('.page-header h1.text-center')));
			console.log('Waiting for OpenAM to load up'.green);
			expect(await bd.findElement(By.css('.page-header h1.text-center')).getText()).toBe('SIGN IN TO OPENAM');
			console.log(`Bad Login: Filling OpenAM login for user ${user.username} and BAD_PASSWORD`.green);
			await browser.driver.findElement(by.id("idToken1")).sendKeys(user.username);
			await browser.driver.findElement(by.id("idToken2")).sendKeys('BAD_PASSWORD');
			await browser.driver.findElement(by.css("form.login input[type=submit]")).click();
			expect(await bd.findElement(By.css('.page-header h1.text-center')).getText()).toBe('SIGN IN TO OPENAM'); // after login this shouldn't happen'
			console.log(`Good Login, Filling OpenAM login for user ${user.username} and the correct password`.green);
			await browser.driver.findElement(by.id("idToken1")).clear();
			await browser.driver.findElement(by.id("idToken2")).clear();
			await browser.driver.findElement(by.id("idToken1")).sendKeys(user.username);
			await browser.driver.findElement(by.id("idToken2")).sendKeys(user.password);
			await browser.driver.findElement(by.css("form.login input[type=submit]")).click();
			/**
			 * We have both angular and non-angular pages (FR pages).
			 * The only place that we deal with non-angular pages is in FR
			 * After a successful FR login, One needs to wait until the first angular page is loaded
			 * We must have the following line to make sure browser is pointing to angular page.
			 */

			await browser.driver.wait(until.elementLocated(by.css("list-relationships page-header h1")));
			console.log(`Confirmed, logined to OpenAM as ${user.username}`.green);
			cb();
		} catch (e) {
			console.log(e);
		}
	});

	it("User's name should be present in top menu bar", function () {
		browser.get(user.firstPage);

		const authPage = new AuthorisationsPage();
		expect(authPage.getUserDisplayName()).toEqual(user.displayName);
	});
});

// afterAll(async function (cb) {
// 	console.log('AfterAll clause ..........................................................................................');
// 	console.log(`Trying to log out for ${users[userIdx].username}`.green);
// 	await browser.driver.navigate().to(user.firstPage + '/openam/logout'); //logout
// 	cb();
// });

class AuthorisationsPage {
	private displayNameElm = $("page-banner top-menu ul li#identity-menu > a");
	constructor() {

	}

	getUserDisplayName = () => {
		return this.displayNameElm.getText();
	}
}

