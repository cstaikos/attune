import { UI_BUTTONS } from "../ui/native-button";
import { Component, computed, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TitleCasePipe } from "@angular/common";
import { Playlist, Profile } from "../../core/models/library";
import { EnergyChart } from "./energy-chart";
import { PrivateReportComponent } from "./private-report";
@Component({
  selector: "app-playlist-card",
  imports: [...UI_BUTTONS, RouterLink, TitleCasePipe, EnergyChart, PrivateReportComponent],
  templateUrl: "./playlist-card.html",
})
export class PlaylistCard {
  readonly playlist = input.required<Playlist>();
  readonly notesPreview = computed(() => {
    const notes = (this.playlist().notes || "").replace(/\s+/g, " ").trim();
    return notes.length > 140 ? `${notes.slice(0, 139).trimEnd()}…` : notes;
  });
  readonly creator = input<Profile>();
  readonly saved = input(false);
  readonly busy = input(false);
  readonly save = output<void>();
}
