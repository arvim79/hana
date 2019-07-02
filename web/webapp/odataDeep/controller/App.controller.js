/*eslint no-console: 0, no-unused-vars: 0, no-use-before-define: 0, no-redeclare: 0, no-undef: 0, no-sequences: 0, no-unused-expressions: 0, quotes: 0*/
/*eslint-env es6 */
//To use a javascript controller its name must end with .controller.js
sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
	"use strict";

	return Controller.extend("sap.shineNext.odataDeep.controller.App", {

		logout: function () {
			window.location.href = "../my/logout";
		},
		
		onInit: function () {
			this.getView().addStyleClass("sapUiSizeCompact"); // make everything inside this View appear in Compact mode
			try {
				var aUrl = "../node/getSessionInfo";
				var userData = jQuery.ajax({
					url: aUrl,
					method: "GET",
					dataType: "json",
					async: false
				}).responseJSON;
				var initials = userData.session[0].givenName[0] + userData.session[0].familyName[0];
				var config = this.getOwnerComponent().getModel("config");
				config.setProperty("/UserName", initials);
				config.setProperty("/fullName", userData.session[0].givenName + userData.session[0].familyName);
				config.setProperty("/givenName", userData.session[0].givenName);
				config.setProperty("/familyName", userData.session[0].familyName);
				config.setProperty("/locale", userData.session[0].Language);
				config.setProperty("/email", userData.session[0].emails[0].value);

			} catch (exp) {
				/* Do nothing, wrapping with try/catch so that if for some reason copilot resources doesn't load
				   this will atleast let the user use the rest of the application gracefully. */
			}			
			var model = new sap.ui.model.json.JSONModel({});
			this.getView().setModel(model);
			this.getView().addStyleClass("sapUiSizeCompact"); // make everything inside this View appear in Compact mode
		},

		callCreateService: function () {
			var result = this.getView().getModel().getData();
			var oBusinessPartner = {};
			oBusinessPartner.PARTNERID = "0000000000";
			oBusinessPartner.EMAILADDRESS = result.Email;
			oBusinessPartner.COMPANYNAME = result.CompanyName;

			var oAddress = {};
			oAddress.ADDRESSID = "0000000000";
			oAddress.CITY = result.City;

			var oLink = {};
			oLink.uri = "$2";

			var xhr = new XMLHttpRequest();

			xhr.open("POST", '../sap/hana/democontent/epm/services/businessPartnersAddresses.xsodata/$batch', true);

			var token = getCSRFToken();
			xhr.setRequestHeader("X-CSRF-Token", token);

			xhr.setRequestHeader("Accept", 'application/json');
			xhr.setRequestHeader("Content-Type", 'multipart/mixed;boundary=batch');
			xhr.setRequestHeader("DataServiceVersion", '2.0');
			xhr.setRequestHeader("MaxDataServiceVersion", '2.0');

			var body = '';

			body += '--batch' + '\r\n';
			body += 'Content-Type:multipart/mixed;boundary=changeset' + '\r\n';
			body += 'Content-Transfer-Encoding:binary' + '\r\n';
			body += '\r\n';

			body += '--changeset' + '\r\n';
			body += 'Content-Type:application/http' + '\r\n';
			body += 'Content-Transfer-Encoding:binary\r\n';
			body += 'Content-ID: 1\r\n';
			body += '\r\n';

			body += 'POST BusinessPartners HTTP/1.1\r\n';
			body += "Content-Type: application/json\r\n";
			var jsonBP = JSON.stringify(oBusinessPartner);
			body += "Content-Length:" + jsonBP.length + '\r\n';
			body += '\r\n';
			body += jsonBP + '\r\n';
			body += '--changeset' + '\r\n';

			body += 'Content-Type:application/http' + '\r\n';
			body += 'Content-Transfer-Encoding:binary\r\n';
			body += 'Content-ID: 2\r\n';
			body += '\r\n';

			body += 'POST Addresses HTTP/1.1\r\n';
			body += "Content-Type:application/json\r\n";
			var jsonAdd = JSON.stringify(oAddress);
			body += "Content-Length:" + jsonAdd.length + '\r\n';
			body += '\r\n';

			body += jsonAdd + '\r\n';
			body += '--changeset' + '\r\n';

			body += 'Content-Type:application/http' + '\r\n';
			body += 'Content-Transfer-Encoding:binary\r\n';
			body += '\r\n';

			body += 'PUT $1/$links/AddRef HTTP/1.1\r\n';
			body += "Content-Type:application/json\r\n";
			var jsonLink = JSON.stringify(oLink);
			body += "Content-Length:" + jsonLink.length + '\r\n';
			body += '\r\n';

			body += jsonLink + '\r\n';

			body += '--changeset' + '--\r\n';
			body += '\r\n';

			body += '--batch' + '--\r\n';

			xhr.onload = function () {};
			xhr.send(body);
			sap.ui.require(["sap/m/MessageToast"], (MessageToast) => {
				MessageToast.show("Business Partner created");
			});
		},
		
		onAvatar: function (oEvent) {
			this.createPopover();
			this._oQuickView.setModel(this.getOwnerComponent().getModel("config"));
			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
			var oButton = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function () {
				this._oQuickView.openBy(oButton);
			});
		},

		createPopover: function () {
			if (this._oQuickView) {
				this._oQuickView.destroy();
			}

			this._oQuickView = sap.ui.xmlfragment("opensap.odataBasic.view.QuickView", this);
			this.getView().addDependent(this._oQuickView);
		},

		onExit: function () {
			if (this._oQuickView) {
				this._oQuickView.destroy();
			}
		}		
	});
});