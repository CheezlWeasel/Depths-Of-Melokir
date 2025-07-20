import {BuilderBase} from "./makebrew-builder-base.js";
import {BuilderUi} from "./makebrew-builderui.js";
import {RenderItems} from "../render-items.js";

export class ShopBuilder extends BuilderBase {
	constructor () {
		super({
			titleSidebarLoadExisting: "Copy Existing Shop Entry",
			titleSidebarDownloadJson: "Download Shop Entries as JSON",
			prop: "shop",
			titleSelectDefaultSource: "(Same as Shop)",
		});
		this._renderOutputDebounced = MiscUtil.debounce(() => this._renderOutput(), 50);
		// Only one entry type: shop
		this._tabTypes = [
			{label: "Shop Items", value: "shop"},
		];
		this._activeTab = "shop";
		// Item type options (no baseitem)
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
			{value: "VEH", label: "Vehicle"},
			{value: "EXP", label: "Explosive"},
			{value: "AMMO", label: "Ammunition"},
			{value: "MNT", label: "Mount"},
			{value: "POI", label: "Poison"},
			{value: "CON", label: "Container"},
			{value: "OTH", label: "Other"},
			{value: "GV|DMG", label: "Generic Variant"},
			{value: "EM", label: "Emblem"},
			{value: "EHMT", label: "Enhancement"},
			{value: "SC|DMG", label: "Spell Scroll"},
		];
		this._itemTypeVals = this._itemTypeOptions.map(it => it.value);
		this._itemTypeLabels = {};
		this._itemTypeOptions.forEach(it => this._itemTypeLabels[it.value] = it.label);
		// Item property options (manually listed, similar to itemTypeOptions)
		this._itemPropertyOptions = [
			{value: "2H", label: "Two-Handed"},
			{value: "A", label: "Ammunition"},
			{value: "F", label: "Finesse"},
			{value: "H", label: "Heavy"},
			{value: "L", label: "Light"},
			{value: "LD", label: "Loading"},
			{value: "R", label: "Reach"},
			{value: "RLD", label: "Reload"},
			{value: "S", label: "Special"},
			{value: "T", label: "Thrown"},
			{value: "V", label: "Versatile"},
			{value: "UN", label: "Esoteric"},
		];
		this._itemPropertyVals = this._itemPropertyOptions.map(it => it.value);
		this._itemPropertyLabels = {};
		this._itemPropertyOptions.forEach(it => this._itemPropertyLabels[it.value] = it.label);
		// Rarity options
		this._rarityOptions = [
			{value: "common", label: "common"},
			{value: "uncommon", label: "uncommon"},
			{value: "rare", label: "rare"},
			{value: "very rare", label: "very rare"},
			{value: "legendary", label: "legendary"},
			{value: "artifact", label: "artifact"},
			{value: "varies", label: "varies"},
			{value: "none", label: "None"},
		];
		this._rarityVals = this._rarityOptions.map(it => it.value);
		this._rarityLabels = {};
		this._rarityOptions.forEach(it => this._rarityLabels[it.value] = it.label);
	}

	// Add this before _renderShopInput

	get _weaponCategoryOptions () {
		return [
			{value: "simple", label: "Simple"},
			{value: "martial", label: "Martial"},
		];
	}

	get _damageTypeOptions () {
		return [
			{value: "B", label: "Bludgeoning"},
			{value: "P", label: "Piercing"},
			{value: "S", label: "Slashing"},
			{value: "A", label: "Acid"},
			{value: "C", label: "Cold"},
			{value: "F", label: "Fire"},
			{value: "O", label: "Force"},
			{value: "L", label: "Lightning"},
			{value: "N", label: "Necrotic"},
			{value: "I", label: "Poison"},
			{value: "Y", label: "Psychic"},
			{value: "R", label: "Radiant"},
			{value: "T", label: "Thunder"},
			{value: "", label: "(Other/Custom)"},
		];
	}

	async pHandleSidebarLoadExistingClick () {
		// Implement a search widget for shop entries if available, else no-op
		// Placeholder: you may want to implement a custom search for shop entries
		// const result = await SearchWidget.pGetUserShopSearch();
		// if (result) {
		//     const shop = MiscUtil.copy(await DataLoader.pCacheAndGet(result.page, result.source, result.hash));
		//     return this.pHandleSidebarLoadExistingData(shop);
		// }
	}

	async pHandleSidebarLoadExistingData (shop, opts) {
		opts = opts || {};
		shop.source = this._ui.source;
		delete shop.uniqueId;
		const meta = {...(opts.meta || {}), ...this._getInitialMetaState()};
		this.setStateFromLoaded({s: shop, m: meta});
		this.renderInput();
		this.renderOutput();
	}

	_getInitialState () {
		return {
			...super._getInitialState(),
			name: "New Shop Item",
			type: "OTH",
			value: 0,
			weight: 0,
			rarity: "none",
			seller: "",
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

	doHandleSourcesAdd () { /* No-op for shop */ }

	_renderInputImpl () {
		this.doCreateProxies();
		this.renderInputControls();
		this._renderInputMainTabs();
	}

	_renderInputMainTabs () {
		this._sourcesCache = MiscUtil.copy(this._ui.allSources);
		const $wrp = this._ui.$wrpInput.empty();
		const cb = () => {
			this.renderOutput();
			this.doUiSave();
			this._meta.isModified = true;
		};
		this._cbCache = cb;
		this._resetTabs({tabGroup: "input"});
		const tabs = this._renderTabs(this._tabTypes.map(t => new TabUiUtil.TabMeta({name: t.label, hasBorder: true})), {
			tabGroup: "input",
			cbTabChange: () => {}, // No-op, only one tab
		});
		$$`<div class="ve-flex-v-center w-100 no-shrink ui-tab__wrp-tab-heads--border">${tabs.map(it => it.$btnTab)}</div>`.appendTo($wrp);
		tabs.forEach(it => it.$wrpTab.appendTo($wrp));
		const [shopTab] = tabs;
		this._renderShopInput(shopTab.$wrpTab, cb);
	}

	_renderShopInput($tab, cb) {
		BuilderUi.$getStateIptString("Name", cb, this._state, {nullable: false, callback: () => this.pRenderSideMenu()}, "name").appendTo($tab);
		this._$selSource = this.$getSourceInput(cb).appendTo($tab);
		BuilderUi.$getStateIptEnum(
			"Type",
			cb,
			this._state,
			{
				vals: this._itemTypeVals,
				labels: this._itemTypeLabels,
				fnDisplay: v => this._itemTypeLabels[v] || v
			},
			"type",
		).on("change", () => {
			renderWeaponFields();
		}).appendTo($tab);
		BuilderUi.$getStateIptNumber("Value in CP", cb, this._state, {}, "value").appendTo($tab);
		BuilderUi.$getStateIptNumber("Weight", cb, this._state, {}, "weight").appendTo($tab);
		BuilderUi.$getStateIptEnum(
			"Rarity",
			cb,
			this._state,
			{
				vals: this._rarityVals,
				labels: this._rarityLabels,
				fnDisplay: v => this._rarityLabels[v] || v,
			},
			"rarity",
		).appendTo($tab);
		BuilderUi.$getStateIptString("Seller", cb, this._state, {}, "seller").appendTo($tab);
		// --- Dynamic Properties Dropdowns ---
		const $wrpPropertiesHeader = $(`<div class="mb-2 mkbru__row stripe-even ve-flex-v-center"></div>`).appendTo($tab);
		$wrpPropertiesHeader.append(`<span class="mr-2 mkbru__row-name" style="min-width: 120px;">Property</span>`);
		const $wrpProperties = $(`<div class="ve-flex-col w-100"></div>`).appendTo($wrpPropertiesHeader);
		const updatePropertiesState = () => {
			const vals = $wrpProperties.find("select").map(function() { return $(this).val(); }).get().filter(Boolean);
			this._state.property = [...new Set(vals)];
			cb();
		};
		const renderPropertyDropdowns = () => {
			$wrpProperties.empty();
			const selected = this._state.property && Array.isArray(this._state.property) ? this._state.property : [];
			const dropdownCount = selected.length ? selected.length + 1 : 1;
			for (let i = 0; i < dropdownCount; ++i) {
				const val = selected[i] || "";
				const $row = $(`<div class="mb-1"></div>`);
				const $sel = $(`<select class="form-control input-xs form-control--minimal w-100" style="min-width:0;"></select>`);
				$sel.append($(`<option value="">(Select Property)</option>`));
				this._itemPropertyOptions.forEach(opt => {
					$sel.append($(`<option></option>`).val(opt.value).text(opt.label));
				});
				$sel.val(val);
				$sel.change(() => {
					if (!$sel.val()) {
						this._state.property = selected.slice(0, i);
					} else {
						const newSelected = selected.slice(0, i);
						if ($sel.val()) newSelected.push($sel.val());
						this._state.property = newSelected;
					}
					renderPropertyDropdowns();
					updatePropertiesState();
					renderWeaponFields(); // Call weapon fields update on property change
				});
				$row.append($sel);
				$wrpProperties.append($row);
			}
		};
		if (!Array.isArray(this._state.property)) this._state.property = [];
		renderPropertyDropdowns();

		// --- Weapon-specific fields ---
		const renderWeaponFields = () => {
			$tab.find(`#weapon-fields`).remove();
			const isWeapon = this._state.type === "M" || this._state.type === "R";
			const isVersatile = this._state.property.includes("V");
			const isRanged = this._state.type === "R" || this._state.property.includes("T")
			if (!isWeapon) {
				this._state.dmg1 = "";
				this._state.dmgType = "";
				this._state.dmg2 = "";
				this._state.range = "";
			}
			if (!isVersatile) {
				this._state.dmg2 = "";
			}
			if (!isRanged) {
				this._state.range = "";
			}
			if (isWeapon) {
				const $wrpWeaponFields = $(`<div class="mb-2 mkbru__row stripe-even ve-flex-v-center" id="weapon-fields"></div>`).insertAfter($wrpPropertiesHeader);
				$wrpWeaponFields.append(`<span class="mr-2 mkbru__row-name" style="min-width: 120px;">Weapon</span>`);
				const $wrpWeaponInputs = $(`<div class="ve-flex-col w-100"></div>`).appendTo($wrpWeaponFields);
				BuilderUi.$getStateIptEnum(
					"Weapon Category",
					cb,
					this._state,
					{
						vals: this._weaponCategoryOptions.map(it => it.value),
						labels: Object.fromEntries(this._weaponCategoryOptions.map(it => [it.value, it.label])),
						fnDisplay: v => (this._weaponCategoryOptions.find(it => it.value === v)?.label || v)
					},
					"weaponCategory",
				).appendTo($wrpWeaponInputs);
				BuilderUi.$getStateIptString("Damage Dice (e.g. 1d8)", cb, this._state, {}, "dmg1").appendTo($wrpWeaponInputs);
				BuilderUi.$getStateIptEnum(
					"Damage Type",
					cb,
					this._state,
					{
						vals: this._damageTypeOptions.map(it => it.value),
						labels: Object.fromEntries(this._damageTypeOptions.map(it => [it.value, it.label])),
						fnDisplay: v => (this._damageTypeOptions.find(it => it.value === v)?.label || v)
					},
					"dmgType",
				).appendTo($wrpWeaponInputs);
				if (isVersatile) {
					BuilderUi.$getStateIptString("Damage Dice 2 (e.g. 1d10)", cb, this._state, {}, "dmg2").appendTo($wrpWeaponInputs);
				}
				if (isRanged) {
					BuilderUi.$getStateIptString("Range", cb, this._state, {}, "range").appendTo($wrpWeaponInputs);
				}
			}
		};
		renderWeaponFields();
		BuilderUi.$getStateIptBoolean("Attunement", cb, this._state, {}, "reqAttune").appendTo($tab);
		BuilderUi.$getStateIptBoolean("Wondrous Item", cb, this._state, {}, "wondrous").appendTo($tab);
		BuilderUi.$getStateIptEntries("Text", cb, this._state, {
			fnPostProcess: (text) => {
				// If text is an array, join it to a string for formatting
				if (Array.isArray(text)) text = text.join("\n");
				if (typeof text !== "string") text = String(text); // Ensure text is a string
				// Format bold/italic
				text = text.replace(/\*\*(.*?)\*\*/g, `{@b $1}`).replace(/\*(.*?)\*/g, `{@i $1}`);
				// Split back into array by newlines, trim, and filter
				return text.split(/\r?\n/).map(e => e.trim()).filter(Boolean);
			},
		}, "entries").appendTo($tab);

		// Add a dropdown for the `baseitem` property
		const $baseItemWrapper = $(`<div class="mb-2 mkbru__row stripe-even ve-flex-v-center"></div>`).appendTo($tab);
		$baseItemWrapper.append(`<span class="mr-2 mkbru__row-name ">Base Item</span>`);

		const $baseItemSelect = $(`<select class="form-control input-xs form-control--minimal"></select>`).appendTo($baseItemWrapper);
		$baseItemSelect.append(`<option value="">(Select Base Item)</option>`);

		// Populate the dropdown with items from `shop-base.json`
		const baseItems = [
			{ baseItem: "Arbalest|DepthsofMelokir" },
			{ baseItem: "Bagpipes|PHB" },
			{ baseItem: "Battleaxe|PHB" },
			{ baseItem: "Bestial Caestus|DepthsofMelokir" },
			{ baseItem: "Blowgun|PHB" },
			{ baseItem: "Blowgun Needle|PHB" },
			{ baseItem: "Blowgun Needles (50)|PHB" },
			{ baseItem: "Breastplate|PHB" },
			{ baseItem: "Chain Mail|PHB" },
			{ baseItem: "Chain Shirt|PHB" },
			{ baseItem: "Club|PHB" },
			{ baseItem: "Crystal|PHB" },
			{ baseItem: "Dagger|PHB" },
			{ baseItem: "Dart|PHB" },
			{ baseItem: "Drum|PHB" },
			{ baseItem: "Dulcimer|PHB" },
			{ baseItem: "Fan Shield|DepthsofMelokir" },
			{ baseItem: "Flail|PHB" },
			{ baseItem: "Glaive|PHB" },
			{ baseItem: "Greataxe|PHB" },
			{ baseItem: "Greatclub|PHB" },
			{ baseItem: "Greatsword|PHB" },
			{ baseItem: "Halberd|PHB" },
			{ baseItem: "Half Plate Armor|PHB" },
			{ baseItem: "Hand Crossbow|PHB" },
			{ baseItem: "Handaxe|PHB" },
			{ baseItem: "Heavy Crossbow|PHB" },
			{ baseItem: "Hide Armor|PHB" },
			{ baseItem: "Horn|PHB" },
			{ baseItem: "Javelin|PHB" },
			{ baseItem: "Katar|SterlingVermin" },
			{ baseItem: "Knuckledusters|DepthsofMelokir" },
			{ baseItem: "Knuckle Knives|SterlingVermin" },
			{ baseItem: "Lance|PHB" },
			{ baseItem: "Leather Armor|PHB" },
			{ baseItem: "Light Crossbow|PHB" },
			{ baseItem: "Light Hammer|PHB" },
			{ baseItem: "Longbow|PHB" },
			{ baseItem: "Longsword|PHB" },
			{ baseItem: "Lute|PHB" },
			{ baseItem: "Lyre|PHB" },
			{ baseItem: "Mace|PHB" },
			{ baseItem: "Maul|PHB" },
			{ baseItem: "Morningstar|PHB" },
			{ baseItem: "Net|PHB" },
			{ baseItem: "Orb|PHB" },
			{ baseItem: "Pike|PHB" },
			{ baseItem: "Quarterstaff|PHB" },
			{ baseItem: "Rapier|PHB" },
			{ baseItem: "Scimitar|PHB" },
			{ baseItem: "Shield|PHB" },
			{ baseItem: "Shortbow|PHB" },
			{ baseItem: "Shortsword|PHB" },
			{ baseItem: "Sickle|PHB" },
			{ baseItem: "Sling|PHB" },
			{ baseItem: "Spear|PHB" },
			{ baseItem: "Staff|PHB" },
			{ baseItem: "Throwing Axe|PHB" },
			{ baseItem: "Trident|PHB" },
			{ baseItem: "War Pick|PHB" },
			{ baseItem: "Warhammer|PHB" },
			{ baseItem: "Whip|PHB" },
			{ baseItem: "Wicked Sickle|DepthsofMelokir" },
		];

		baseItems.forEach(item => {
			const displayText = item.baseItem.split('|')[0]; // Display only the name, excluding the source
			$baseItemSelect.append(`<option value="${item.baseItem}">${displayText}</option>`);
		});

		$baseItemSelect.change(() => {
			this._state.baseitem = $baseItemSelect.val() || undefined;
			cb();
		});
	}

	renderOutput () {
		this._renderOutput();
	}

	_getRenderableItem () {
		const item = MiscUtil.copy(this._state);

		// --- Attunement normalization ---
		// 5eTools expects reqAttune to be boolean true or a non-empty string (for specific requirements)
		if (item.reqAttune) {
			item.reqAttune = true;
			item._attunement = "(requires attunement)";
		} else {
			delete item.reqAttune;
			delete item._attunement;
		}

		// --- Normalize property to always be an array ---
		if (item.property && !Array.isArray(item.property)) {
			item.property = [item.property];
		}

		// --- Normalize entries ---
		if (typeof item.entries === "string") {
			item.entries = [item.entries];
		} else if (!Array.isArray(item.entries)) {
			item.entries = [];
		}

		// --- Support lists in entries ---
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

		// --- Normalize weight ---
		if (typeof item.weight === "string" && item.weight.trim() !== "") {
			const num = Number(item.weight);
			if (!isNaN(num)) item.weight = num;
		}

		// --- Normalize page ---
		if (typeof item.page === "string" && item.page.trim() !== "") {
			const num = Number(item.page);
			if (!isNaN(num)) item.page = num;
		}

		// --- Normalize rarity ---
		if (typeof item.rarity !== "string" || !item.rarity.trim() || ["none","false","true"].includes(item.rarity.trim().toLowerCase())) {
			item.rarity = undefined;
		} else {
			item.rarity = item.rarity.trim();
			item.rarity = item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1).toLowerCase();
		}

		// --- Ensure source is always set ---
		if (!item.source) {
			item.source = "Temp";
		}

		// --- Remove undefined/empty fields ---
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
		this._resetTabs({tabGroup: "output"});
		const $wrp = this._ui.$wrpOutput.empty();
		const tabs = this._renderTabs(this._tabTypes.map(t => new TabUiUtil.TabMeta({name: t.label})), {tabGroup: "output"});
		$$`<div class="ve-flex-v-center w-100 no-shrink ui-tab__wrp-tab-heads--border">${tabs.map(it => it.$btnTab)}</div>`.appendTo($wrp);
		tabs.forEach(it => it.$wrpTab.appendTo($wrp));
		const [shopTab] = tabs;
		this._renderShopOutput(shopTab.$wrpTab);
		const $btnDownload = $("<button class=\"btn btn-xs btn-primary mt-2\">Download JSON</button>")
			.click(() => {
				const item = this._getRenderableItem();
				const jsonStr = JSON.stringify(item, null, 2);
				const blob = new Blob([jsonStr], {type: "application/json"});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${item.name ? item.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() : "shop_entry"}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			});
		$btnDownload.appendTo($wrp);
	}

	_renderShopOutput ($tab) {
		const renderableItem = this._getRenderableItem();
		if (RenderItems && typeof RenderItems.$getRenderedItem === "function") {
			// Always use the standard 'nice' UI renderer
			const $item = $(RenderItems.$getRenderedItem(renderableItem));
			$tab.append($item);
		} else {
			// Fallback: just show JSON if renderer is missing (should not happen in production)
			$$`<div class="veapp__msg ve-flex-vh-center">Shop Item JSON Preview</div>`.appendTo($tab);
			$$`<pre class="ui-pre w-100">${JSON.stringify(renderableItem, null, 2)}</pre>`.appendTo($tab);
		}
	}
}
