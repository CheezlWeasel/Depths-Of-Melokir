import {BuilderBase} from "./makebrew-builder-base.js";
import {BuilderUi} from "./makebrew-builderui.js";

export class MagicVariantBuilder extends BuilderBase {
	constructor () {
		super({
			titleSidebarLoadExisting: "Copy Existing Magic Variant",
			titleSidebarDownloadJson: "Download Magic Variants as JSON",
			prop: "magicvariant",
			titleSelectDefaultSource: "(Same as Magic Variant)",
		});
		this._renderOutputDebounced = MiscUtil.debounce(() => this._renderOutput(), 50);
		this._itemTypeOptions = [
			{value: "A", label: "Armor"},
			{value: "M", label: "Melee Weapon"},
			{value: "R", label: "Ranged Weapon"},
			{value: "S", label: "Shield"},
			{value: "G", label: "Adventuring Gear"},
			{value: "SCF", label: "Spellcasting Focus"},
			{value: "T", label: "Tool"},
			{value: "INS", label: "Instrument"},
			{value: "GS", label: "Gaming Set"},
			{value: "P", label: "Potion"},
			{value: "RD", label: "Rod"},
			{value: "RG", label: "Ring"},
			{value: "W", label: "Wand"},
			{value: "WD", label: "Wondrous Item"},
			{value: "VEH", label: "Vehicle"},
			{value: "EXP", label: "Explosive"},
			{value: "AMMO", label: "Ammunition"},
			{value: "MNT", label: "Mount"},
			{value: "POI", label: "Poison"},
			{value: "CON", label: "Container"},
			{value: "OTH", label: "Other"},
			{value: "GV|DMG", label: "Generic Variant (for magicvariant)"},
		];
		this._itemTypeVals = this._itemTypeOptions.map(it => it.value);
		this._itemTypeLabels = {};
		this._itemTypeOptions.forEach(it => this._itemTypeLabels[it.value] = it.label);
	}

	_getInitialState () {
		return {
			...super._getInitialState(),
			name: "New Magic Variant",
			type: "GV|DMG",
			edition: "",
			requires: [],
			inherits: {},
			entries: [],
			source: this._ui ? this._ui.source : "",
		};
	}

	setStateFromLoaded (state) {
		if (!state?.s || !state?.m) return;
		this._doResetProxies();
		if (!state.s.uniqueId) state.s.uniqueId = CryptUtil.uid();
		this.__state = state.s;
		this.__meta = state.m;
	}

	_renderInputImpl () {
		this.doCreateProxies();
		this.renderInputControls();
		this._renderInputMain();
	}

	_renderInputMain () {
		this._sourcesCache = MiscUtil.copy(this._ui.allSources);
		const $wrp = this._ui.$wrpInput.empty();
		const cb = () => {
			this.renderOutput();
			this.doUiSave();
			this._meta.isModified = true;
		};
		this._cbCache = cb;
		BuilderUi.$getStateIptString("Name", cb, this._state, {nullable: false, callback: () => this.pRenderSideMenu()}, "name").appendTo($wrp);
		this._$selSource = this.$getSourceInput(cb).appendTo($wrp);
		BuilderUi.$getStateIptEnum(
			"Type (e.g. GV|DMG)",
			cb,
			this._state,
			{
				vals: this._itemTypeVals,
				labels: this._itemTypeLabels,
				fnDisplay: v => this._itemTypeLabels[v] || v
			},
			"type"
		).appendTo($wrp);
		BuilderUi.$getStateIptString("Edition", cb, this._state, {}, "edition").appendTo($wrp);
		BuilderUi.$getStateIptStringArray("Requires (e.g. {type: 'HA'})", cb, this._state, {shortName: "Require", placeholder: '{"type": "HA"}'}, "requires").appendTo($wrp);
		BuilderUi.$getStateIptObject("Inherits (object)", cb, this._state, {placeholder: '{"nameSuffix": " of Gleaming", "source": "XGE", ...}'}, "inherits").appendTo($wrp);
		BuilderUi.$getStateIptEntries("Text", cb, this._state, {fnPostProcess: BuilderUi.fnPostProcessDice}, "entries").appendTo($wrp);
	}

	renderOutput () {
		this._renderOutput();
	}

	_getRenderableItem() {
		const item = MiscUtil.copy(this._state);
		if (typeof item.entries === "string") {
			item.entries = [item.entries];
		} else if (!Array.isArray(item.entries)) {
			item.entries = [];
		}
		if (Array.isArray(item.entries) && item.entries.length) {
			let newEntries = [];
			let currentList = null;
			item.entries.forEach(entry => {
				if (typeof entry === "string" && entry.trim().startsWith("- ")) {
					if (!currentList) currentList = {type: "list", items: []};
					currentList.items.push(entry.trim().slice(2));
				} else {
					if (currentList) {
						newEntries.push(currentList);
						currentList = null;
					}
					newEntries.push(entry);
				}
			});
			if (currentList) newEntries.push(currentList);
			item.entries = newEntries;
		}
		if (!item.source) {
			item.source = "Temp";
		}
		Object.keys(item).forEach(k => {
			if (
				item[k] === undefined ||
				item[k] === "" ||
				(Array.isArray(item[k]) && !item[k].length)
			) delete item[k];
		});
		return item;
	}

	_renderOutput () {
		const $wrp = this._ui.$wrpOutput.empty();
		const renderableItem = this._getRenderableItem();
		$$`<div class="veapp__msg ve-flex-vh-center">Magic Variant JSON Preview</div>`.appendTo($wrp);
		$$`<pre class="ui-pre w-100">${JSON.stringify(renderableItem, null, 2)}</pre>`.appendTo($wrp);
		const $btnDownload = $("<button class=\"btn btn-xs btn-primary mt-2\">Download JSON</button>")
			.click(() => {
				const item = this._getRenderableItem();
				const jsonStr = JSON.stringify(item, null, 2);
				const blob = new Blob([jsonStr], {type: "application/json"});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${item.name ? item.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() : "magicvariant"}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			});
		$btnDownload.appendTo($wrp);
	}
}
