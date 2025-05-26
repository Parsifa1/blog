{
  description = "virtual environments";
  inputs.process-compose-flake.url = "github:Platonic-Systems/process-compose-flake";
  inputs.utils.url = "github:hercules-ci/flake-parts";
  outputs =
    inputs@{ utils, nixpkgs, ... }:
    utils.lib.mkFlake { inherit inputs; } {
      systems = [
        "aarch64-darwin"
        "x86_64-linux"
      ];
      imports = [ inputs.process-compose-flake.flakeModule ];
      perSystem =
        { pkgs, system, ... }:
        {
          _module.args.pkgs = import nixpkgs { inherit system; };
          process-compose.dev = {
            settings.processes = {
              frontend-server.command = "pnpm dev";
            };
          };
          devShells.default = pkgs.mkShell {
            name = "cloudtix";
            packages = with pkgs; [ nodejs_24 ];
            env.COMPOSE_SHELL = "fish";
          };
        };
    };
}
