import { Component, effect, HostListener, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TitleCasePipe } from "@angular/common";
import { PLAYLIST_SERVICE } from "../../core/services/service-tokens";
import { MemberSession } from "../../core/auth/member-session";
import { EnergyLevel, MusicService, Playlist } from "../../core/models/library";
import {
  Modality,
  MusicTag,
  ListeningNoteLabel,
} from "../../core/models/taxonomy";
import {
  modalities,
  musicGroups,
  noteGroups,
  services,
} from "../../core/data/ui-options";
import { PlaylistDraft } from "../../core/services/contracts/playlists";
import { durationMinutes } from "../../core/utils/playlist-draft";
import { ServiceError } from "../../core/services/service-error";
import { PageLoad } from "../../shared/state/page-load";
import { ActionState } from "../../shared/state/action-state";
import { PageStatus } from "../../shared/components/page-status";
import { ActionFeedback } from "../../shared/components/action-feedback";
import { EnergyChart } from "../../shared/components/energy-chart";
@Component({
  selector: "app-editor-page",
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TitleCasePipe,
    PageStatus,
    ActionFeedback,
    EnergyChart,
  ],
  templateUrl: "./editor-page.html",
})
export class EditorPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly playlists = inject(PLAYLIST_SERVICE);
  private readonly member = inject(MemberSession);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly page = new PageLoad<Playlist | null>();
  readonly action = new ActionState();
  readonly modalities = modalities;
  readonly musicGroups = musicGroups;
  readonly noteGroups = noteGroups;
  readonly services = services;
  readonly form = this.fb.group({
    title: ["", Validators.required],
    modality: this.fb.control<Modality>("Meditation"),
    hours: [0, [Validators.required, Validators.min(0)]],
    minutes: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
    notes: [""],
    qualities: this.fb.control<MusicTag[]>([]),
    creatorWarningLabels: this.fb.control<ListeningNoteLabel[]>([]),
    listeningReviewed: [false],
    listeningContext: ["", Validators.maxLength(1000)],
    links: this.fb.group({
      spotify: [""],
      youtube: [""],
      apple: [""],
      other: [""],
    }),
    energy: this.fb.array([1, 2, 3, 4, 3, 2].map((n) => this.fb.control(n))),
    tracks: this.fb.array<ReturnType<EditorPage["trackControl"]>>([]),
  });
  constructor() {
    effect(() => {
      void this.load(this.params().get("id"));
    });
  }
  get id() {
    return this.params().get("id");
  }
  get cancelLink() {
    return this.id ? ["/playlist", this.id] : ["/contributions"];
  }
  private trackControl(title = "", artist = "") {
    return this.fb.group({
      title: [title, Validators.required],
      artist: [artist, Validators.required],
    });
  }
  async load(id = this.id) {
    await this.page.run(async () => {
      const p = id ? await this.playlists.get(id) : null;
      if (p && p.creatorId !== this.member.session()?.userId)
        throw new ServiceError(
          "forbidden",
          "You can only edit your own contributions.",
        );
      if (id !== this.id) return p;
      const total = p ? durationMinutes(p.duration) || 0 : 0;
      this.form.reset({
        title: p?.title || "",
        modality: p?.modality || "Meditation",
        hours: Math.floor(total / 60),
        minutes: total % 60,
        notes: p?.notes || "",
        qualities: p?.qualities || [],
        creatorWarningLabels: p
          ? [
              ...new Set([
                ...p.creatorWarningLabels,
                ...p.listeningReports
                  .filter((report) => report.userId === p.creatorId)
                  .map((report) => report.label),
              ]),
            ]
          : [],
        listeningReviewed: p?.listeningReviewed || false,
        listeningContext: p?.listeningContext || "",
        links: {
          spotify: p?.links.spotify || "",
          youtube: p?.links.youtube || "",
          apple: p?.links.apple || "",
          other: p?.links.other || "",
        },
      });
      this.form.controls.energy.clear();
      for (const n of p?.energyCurve || [1, 2, 3, 4, 3, 2])
        this.form.controls.energy.push(this.fb.control(n));
      this.form.controls.tracks.clear();
      for (const track of p?.tracks || [])
        this.form.controls.tracks.push(
          this.trackControl(track.title, track.artist),
        );
      this.form.markAsPristine();
      return p;
    });
  }
  toggleTag(tag: MusicTag) {
    const control = this.form.controls.qualities;
    let tags = control.value.includes(tag)
      ? control.value.filter((t) => t !== tag)
      : [...control.value, tag];
    if (
      tags.includes("no vocals") &&
      tag !== "no vocals" &&
      ["wordless vocals", "sung lyrics", "spoken word"].includes(tag)
    )
      tags = tags.filter((t) => t !== "no vocals");
    if (tag === "no vocals" && tags.includes(tag))
      tags = tags.filter(
        (t) => !["wordless vocals", "sung lyrics", "spoken word"].includes(t),
      );
    control.setValue(tags);
    control.markAsDirty();
  }
  toggleNote(note: ListeningNoteLabel) {
    const control = this.form.controls.creatorWarningLabels;
    control.setValue(
      control.value.includes(note)
        ? control.value.filter((n) => n !== note)
        : [...control.value, note],
    );
    control.markAsDirty();
  }
  addPoint() {
    if (this.form.controls.energy.length < 24) {
      this.form.controls.energy.push(this.fb.control(2));
      this.form.markAsDirty();
    }
  }
  removePoint(index: number) {
    if (this.form.controls.energy.length > 2) {
      this.form.controls.energy.removeAt(index);
      this.form.markAsDirty();
    }
  }
  addTrack() {
    this.form.controls.tracks.push(this.trackControl());
    this.form.markAsDirty();
  }
  removeTrack(index: number) {
    this.form.controls.tracks.removeAt(index);
    this.form.markAsDirty();
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.action.error.set(
        "Complete the required fields and check the duration and tracks.",
      );
      return;
    }
    void this.action.run(async () => {
      const v = this.form.getRawValue();
      if (!Number.isInteger(v.hours) || !Number.isInteger(v.minutes))
        throw new ServiceError(
          "invalid-input",
          "Duration must use whole hours and minutes.",
        );
      const draft: PlaylistDraft = {
        title: v.title,
        modality: v.modality,
        duration: `${v.hours * 60 + v.minutes}m`,
        energyCurve: v.energy as EnergyLevel[],
        notes: v.notes,
        qualities: v.qualities,
        creatorWarningLabels: v.creatorWarningLabels,
        listeningReviewed: v.listeningReviewed,
        listeningContext: v.listeningContext,
        links: Object.fromEntries(
          Object.entries(v.links).filter(([, value]) => value.trim()),
        ) as Partial<Record<MusicService, string>>,
        tracks: v.tracks,
      };
      const playlist = this.id
        ? await this.playlists.update(this.id, draft)
        : await this.playlists.create(draft);
      this.form.markAsPristine();
      await this.router.navigate(["/playlist", playlist.id]);
    });
  }
  @HostListener("window:beforeunload", ["$event"]) beforeUnload(
    event: BeforeUnloadEvent,
  ) {
    if (this.form.dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  }
}
