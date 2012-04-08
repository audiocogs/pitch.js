#include "libda/fft.hpp"
#include <stdio.h>
#include <stdlib.h>
#include <vector>
#include <complex>
#include <iostream>
#include <string.h>

#define DEBUG(...) { fprintf(stderr, __VA_ARGS__); fprintf(stderr, "\n"); }
#define ERROR(...) { fprintf(stderr, "ERROR: "); fprintf(stderr, __VA_ARGS__); fprintf(stderr, "\n"); }

static const int BUFFER_P = 5;
static const int BUFFER_LEN = 1 << BUFFER_P;

typedef enum {
	REF_NO_ERROR,
	REF_ERROR_INVALID_ARGUMENTS,
	REF_ERROR_STATE_ALLOCATION,
	REF_ERROR_FILE_READ,
	REF_ERROR_FILE_WRITE,
	REF_ERROR_NOT_MONO,
} ref_test_error;

typedef struct {
	double *window;
	FILE *outfile;
} ref_state;

typedef std::vector<std::complex<float> > fft_t;

using namespace std;

void process_data (double *data, ref_state *state) ;

int main (int argc, char *argv[]) {
	if (argc != 2) {
		DEBUG("Usage: ./ref.out <outputfile>")
		return REF_NO_ERROR;
	}

	char *outpath = argv[1];

	double data [BUFFER_LEN];
	double window [BUFFER_LEN];

	FILE *outfile;

	ref_state *state;

	DEBUG("Generating test file `%s` from some example data",
		outpath)

	/*
		Preparations:
		 * allocate state
		 * open files
		 * check for data validity
		 * initialize Analyzer
	*/

	state = (ref_state*) malloc(sizeof(*state));
	if (state == NULL) {
		ERROR("Failed to allocate state")

		return REF_ERROR_STATE_ALLOCATION;
	}

	if (strcmp(outpath, "-")) {
		outfile = fopen(outpath, "w+");

		if (outfile == NULL) {
			ERROR("Failed to open output file `%s` for writing",
				outpath)

			return REF_ERROR_FILE_WRITE;
		}
	} else {
		outfile = stdout;
	}

	state->outfile = outfile;

	state->window = window;

	/* Let the magic begin */

	for (int i=0; i<BUFFER_LEN; i++) {
		window[i] = 1.0;
	}

	data[0] = 1.0;

	process_data(data, state);

	data[BUFFER_LEN - 1] = 1.0;

	process_data(data, state);

	data[BUFFER_LEN/2] = 0.5;

	process_data(data, state);

	/* "Always close the files you have opened" yeah yeah... */

	fclose(outfile);

	/* Let's get outta here */

	DEBUG("Done")
	
	return REF_NO_ERROR;
}

void process_data (double *data, ref_state *state) {
	const fft_t fft = da::fft<BUFFER_P>(data, state->window);
	
	// FUCK iterators and fuck C++ streams
	for(int i = 0; i < BUFFER_LEN; i++) {
		fprintf(state->outfile, "%f\n%f\n", real(fft[i]), imag(fft[i]));
	}
}
