#!/usr/bin/env bash

# Extract command path from completion words array
_sos_extract_cmd_path() {
  local result=""
  for ((i=1; i<$1; i++)); do
    if [[ ${COMP_WORDS[i]} != -* ]]; then
      if [[ -n "$result" ]]; then
        result="${result} ${COMP_WORDS[i]}"
      else
        result="${COMP_WORDS[i]}"
      fi
    fi
  done
  echo "$result"
}

# Common completion logic
_sos_completion_impl() {
  local cur="$1"
  local prev="$2"
  local cmd_path="$3"
  
  # Handle direct command completion or empty command path
  if [[ "${cur}" == *sos* || -z "$cmd_path" ]]; then
    COMPREPLY=( $(compgen -W "${TOPLEVEL_COMMANDS}" -- "$cur") )
    return 0
  fi
  
  # We need to find the subcommands for the current command path
  # This will be added by the generateCompletionScript function
  # with specific command paths and their subcommands
  case "$cmd_path" in
    # COMMAND_SCHEMA_CASES will be replaced with actual cases during generation
    *)
      # Default to top-level commands
      COMPREPLY=( $(compgen -W "${TOPLEVEL_COMMANDS}" -- "$cur") )
      ;;
  esac
}

# Completion function with bash-completion
_sos_completion() {
  local cur prev words cword split
  _init_completion -s || return

  cmd_path=$(_sos_extract_cmd_path $COMP_CWORD)
  _sos_completion_impl "${COMP_WORDS[COMP_CWORD]}" "${COMP_WORDS[COMP_CWORD-1]}" "$cmd_path"
}

# Fallback completion for systems without bash-completion
_sos_completion_fallback() {
  COMPREPLY=()
  cmd_path=$(_sos_extract_cmd_path $COMP_CWORD)
  _sos_completion_impl "${COMP_WORDS[COMP_CWORD]}" "${COMP_WORDS[COMP_CWORD-1]}" "$cmd_path"
}

# Register the appropriate completion function
if command -v _init_completion >/dev/null 2>&1; then
  complete -F _sos_completion sos
else
  complete -F _sos_completion_fallback sos
fi