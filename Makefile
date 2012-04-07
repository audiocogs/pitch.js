TESTDIR := ./tests
PORT_TARGET := $(TESTDIR)/port/test.js
PORT_FFT_TARGET := $(TESTDIR)/port/test-fft.js
REF_TARGET := $(TESTDIR)/ref/ref.out
REF_FFT_TARGET := $(TESTDIR)/ref/fft.out
PORT_SOURCE := src/pitch.js $(TESTDIR)/tools/wavreader.js
REF_SOURCE := $(TESTDIR)/ref/pitch.cc $(TESTDIR)/ref/test.cc
REF_FFT_SOURCE := $(TESTDIR)/ref/test-fft.cc
WAVTESTS := $(patsubst %.wav,%.test,$(wildcard *.wav))

COMPARE := $(TESTDIR)/tools/compare.js
CXX := g++

CXX_FLAGS := -Wall -lm -lsndfile

all: fft.test $(WAVTESTS)

$(REF_TARGET): $(REF_SOURCE)
	$(CXX) $(CXX_FLAGS) $^ -o $@

$(REF_FFT_TARGET): $(REF_FFT_SOURCE)
	$(CXX) $(CXX_FLAGS) $^ -o $@

$(PORT_TARGET): $(PORT_SOURCE)
	touch $@ # Nasty, but saves time

$(PORT_FFT_TARGET): $(PORT_SOURCE)
	touch $@

fft.ref.data: $(REF_FFT_TARGET)
	$^ $@

fft.port.data: $(PORT_FFT_TARGET)
	$^ $@

%.test: %.ref.data %.port.data
	$(COMPARE) $^ > $@

%.ref.data: $(REF_TARGET) %.wav
	$^ $@

%.port.data: $(PORT_TARGET) %.wav
	$^ $@

clean:
	rm -rf $(REF_TARGET) $(REF_FFT_TARGET) *.data */*.data */*/*.data *.test */*.test */*/*.test

.PHONY: all clean
.SECONDARY:
