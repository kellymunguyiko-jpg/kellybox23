export interface DownloadLink {
  url: string;
  label: string; // e.g. "1080p HD", "720p", "4K BluRay"
  size?: string; // e.g. "2.1 GB"
  type: "mega" | "youtube" | "direct" | "gdrive" | "mediafire";
}

export interface Movie {
  id?: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  thumbnailUrl?: string; // custom video thumbnail shown before play
  year: number;
  rating: number;
  duration: string;
  genre: string[];
  type: "movie" | "series";
  videoUrl: string;
  videoType: "youtube" | "mega" | "mediafire" | "gdrive" | "other";
  downloadUrl?: string;
  downloadLabel?: string;
  downloadLinks?: DownloadLink[];
  featured?: boolean;
  createdAt?: number;
  server?: 1 | 2 | "both"; // which Firebase server this movie is stored on
}

export interface AdminCredentials {
  username: string;
  password: string;
}
