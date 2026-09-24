package api

import (
	"encoding/json"
	"errors"
	"sort"
	"strconv"
	"strings"
)

// Bytes is binary data in the JSON form of the Hemmelig API.
//
// The API sends and receives Uint8Array values as objects with numeric keys,
// for example {"0":12,"1":255}. Bytes also reads the Node.js Buffer form
// {"type":"Buffer","data":[...]} and plain arrays.
type Bytes []byte

// MarshalJSON writes the object form that the API expects.
func (b Bytes) MarshalJSON() ([]byte, error) {
	var out strings.Builder
	out.Grow(len(b)*7 + 2)
	out.WriteByte('{')
	for i, value := range b {
		if i > 0 {
			out.WriteByte(',')
		}
		out.WriteByte('"')
		out.WriteString(strconv.Itoa(i))
		out.WriteString(`":`)
		out.WriteString(strconv.Itoa(int(value)))
	}
	out.WriteByte('}')
	return []byte(out.String()), nil
}

// UnmarshalJSON reads the object form, the Buffer form or an array.
func (b *Bytes) UnmarshalJSON(data []byte) error {
	trimmed := strings.TrimSpace(string(data))
	if trimmed == "null" {
		*b = nil
		return nil
	}

	if strings.HasPrefix(trimmed, "[") {
		var values []int
		if err := json.Unmarshal(data, &values); err != nil {
			return err
		}
		return b.fromInts(values)
	}

	var buffer struct {
		Type string `json:"type"`
		Data []int  `json:"data"`
	}
	if err := json.Unmarshal(data, &buffer); err == nil && buffer.Type == "Buffer" {
		return b.fromInts(buffer.Data)
	}

	var object map[string]int
	if err := json.Unmarshal(data, &object); err != nil {
		return err
	}
	keys := make([]int, 0, len(object))
	for key := range object {
		index, err := strconv.Atoi(key)
		if err != nil {
			return errors.New("byte object has a non-numeric key")
		}
		keys = append(keys, index)
	}
	sort.Ints(keys)
	out := make([]byte, len(keys))
	for i, key := range keys {
		value := object[strconv.Itoa(key)]
		if value < 0 || value > 255 {
			return errors.New("byte value out of range")
		}
		out[i] = byte(value)
	}
	*b = out
	return nil
}

func (b *Bytes) fromInts(values []int) error {
	out := make([]byte, len(values))
	for i, value := range values {
		if value < 0 || value > 255 {
			return errors.New("byte value out of range")
		}
		out[i] = byte(value)
	}
	*b = out
	return nil
}
