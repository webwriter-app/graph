import { LitElementWw } from "@webwriter/lit";
import { html, TemplateResult } from "lit";
import { localized, msg } from "@lit/localize";

import styles from "./options.styles";

import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js";
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js";
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js";
import SlDivider from "@shoelace-style/shoelace/dist/components/divider/divider.component.js";
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js";
import SlDetails from "@shoelace-style/shoelace/dist/components/details/details.component.js";
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.component.js";

import { permissionGroups } from "utils/permissions";
import { property } from "lit/decorators.js";
import { PermissionsType } from "types";
import { SlChangeEvent } from "@shoelace-style/shoelace";

@localized()
export class OptionsComponent extends LitElementWw {
	public static get scopedElements() {
		return {
			"sl-icon": SlIcon,
			"sl-tooltip": SlTooltip,
			"sl-select": SlSelect,
			"sl-option": SlOption,
			"sl-divider": SlDivider,
			"sl-checkbox": SlCheckbox,
			"sl-details": SlDetails,
			"sl-switch": SlSwitch,
		};
	}

	static styles = styles;

	@property({ type: Object })
	accessor permissions: PermissionsType = null!;

	private _setPermission(
		permissionGroup: string,
		permissionId: string,
		value: boolean | string[],
	) {
		this.dispatchEvent(
			new CustomEvent("permission-change", {
				bubbles: true,
				composed: true,
				detail: {
					group: permissionGroup,
					id: permissionId,
					value: value,
				},
			}),
		);
	}

	protected renderPermissionGroup(
		group: (typeof permissionGroups)[0],
	): TemplateResult {
		const groupPerms = this.permissions?.[group.id] as Record<string, any> | undefined;
		return html`
			<sl-details class="permission-group">
				<div slot="summary" class="permission-group-header">
					<sl-icon .src=${group.icon}></sl-icon>
					<span>${group.name}</span>
				</div>
				<div class="permissions">
					${group.permissions.map((permission) => {
						if (permission.type === "checkbox")
							return html`
								<sl-switch
									?checked=${groupPerms?.[permission.id]}
									?disabled=${!groupPerms ||
									(group.id !== "general" &&
										permission.id !== "enabled" &&
										!groupPerms.enabled) ||
									(group.id === "general" &&
										permission.id === "playbackRate" &&
										!this.permissions?.general.play)}
									@sl-change=${() =>
										this._setPermission(
											group.id,
											permission.id,
											!groupPerms?.[permission.id],
										)}
								>
									<sl-icon
										.src=${(permission as any).icon}
										slot="prefix"
									></sl-icon>
									${permission.name}
								</sl-switch>
							`;
						if (permission.type === "multiselect") {
							return html`
								<sl-select
									label=${permission.name}
									multiple
									?disabled=${!groupPerms ||
									!groupPerms.enabled}
									max-options-visible="1"
									hoist
									.value=${groupPerms &&
									permission.id in groupPerms &&
									groupPerms[permission.id]
										? groupPerms[permission.id]
										: []}
									@sl-change=${(e: SlChangeEvent) => {
										const value = (e.target as SlSelect)
											.value as string[];
										this._setPermission(
											group.id,
											permission.id,
											value,
										);
									}}
								>
									${permission.options?.map(
										(option) => html`
											<sl-option
												value=${option.id}
												?selected=${groupPerms?.[permission.id]?.includes(option.id)}
											>
												${option.name}
											</sl-option>
										`,
									)}
								</sl-select>
							`;
						}
					})}
				</div>
			</sl-details>
		`;
	}

	protected render(): TemplateResult {
		return html`<h2>${msg("Permissions")}</h2>

			${permissionGroups.map((group) =>
				this.renderPermissionGroup(group),
			)} `;
	}
}
