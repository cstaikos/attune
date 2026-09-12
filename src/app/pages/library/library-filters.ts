import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TitleCasePipe } from "@angular/common";
import { PlaylistQuery } from "../../core/services/contracts/playlists";
import {
  modalities,
  musicGroups,
  noteLabels,
  services,
} from "../../core/data/ui-options";
@Component({
  selector: "app-library-filters",
  imports: [FormsModule, RouterLink, TitleCasePipe],
  templateUrl: "./library-filters.html",
})
export class LibraryFilters {
  readonly query = input.required<PlaylistQuery>();
  readonly changed = output<PlaylistQuery>();
  readonly excludedVoices = ["sung lyrics", "spoken word"] as const;
  readonly modalities = modalities;
  readonly musicGroups = musicGroups;
  readonly noteLabels = noteLabels;
  readonly services = services;
  patch(patch: Partial<PlaylistQuery>) {
    this.changed.emit({ ...this.query(), ...patch });
  }
  toggle(
    key: "qualities" | "excludedQualities" | "excludedWarnings" | "services",
    value: string,
  ) {
    const values: readonly string[] = this.query()[key] || [];
    this.patch({
      [key]: values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    });
  }
}
